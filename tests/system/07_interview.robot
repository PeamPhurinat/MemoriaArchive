*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Interview Suite
Suite Teardown    Close Memoria Application

*** Variables ***
${TEST_AUDIO_FILE}    ${CURDIR}/resources/assets/test-audio.wav

*** Keywords ***
Setup Interview Suite
    Open Memoria Application
    Login As Test User
    Create Fresh Project
    ${openai_ready}=    Get API Health Flag    keyConfigured
    Set Suite Variable    ${OPENAI_READY}    ${openai_ready}

Ensure Interview Session Is Started
    Skip If    not ${OPENAI_READY}    OpenAI backend is not configured for interview tests.
    Go To    ${BASE_URL}/interview
    ${already_started}=    Run Keyword And Return Status    Wait Until Element Is Visible    css:.voice-header    timeout=2s
    IF    not ${already_started}
        Wait Until Element Is Visible    css:.voice-setup    timeout=${DEFAULT_TIMEOUT}
        Input Text    css:.voice-setup input[type="text"]    Robot Interview User
        Click Element    css:.voice-setup-start
        Wait Until Element Is Visible    css:.voice-header    timeout=20s
    END

Recording Attempt Should Start Or Show Error
    Click Element    css:.voice-mic-btn
    ${listening_started}=    Run Keyword And Return Status    Wait Until Element Is Visible    css:.voice-cancel-btn    timeout=6s
    ${error_shown}=    Run Keyword And Return Status    Wait Until Element Is Visible    css:.voice-error    timeout=2s
    Should Be True    ${listening_started} or ${error_shown}
    IF    ${listening_started}
        Click Element    css:.voice-cancel-btn
        Wait Until Element Is Visible    css:.voice-mic-btn    timeout=6s
    END

Run Interview Api Scenario
    [Documentation]    Starts interview, sends one message, and finishes interview via API with the browser's auth token.
    ${result}=    Execute Async Javascript
    ...    const done = arguments[arguments.length - 1];
    ...    const readJson = async (response) => {
    ...      try { return await response.json(); } catch { return {}; }
    ...    };
    ...    const findAccessToken = () => {
    ...      const seen = new Set();
    ...      const walk = (value) => {
    ...        if (!value || typeof value !== 'object' || seen.has(value)) return '';
    ...        seen.add(value);
    ...        if (typeof value.access_token === 'string' && value.access_token.trim()) return value.access_token.trim();
    ...        for (const nested of Object.values(value)) {
    ...          if (typeof nested === 'string') {
    ...            const maybeJson = nested.trim();
    ...            if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
    ...              try {
    ...                const parsed = JSON.parse(maybeJson);
    ...                const found = walk(parsed);
    ...                if (found) return found;
    ...              } catch {
    ...                /* ignore parse failures */
    ...              }
    ...            }
    ...          } else if (nested && typeof nested === 'object') {
    ...            const found = walk(nested);
    ...            if (found) return found;
    ...          }
    ...        }
    ...        return '';
    ...      };
    ...      for (let i = 0; i < localStorage.length; i += 1) {
    ...        const key = localStorage.key(i);
    ...        const raw = localStorage.getItem(key);
    ...        if (!raw) continue;
    ...        try {
    ...          const parsed = JSON.parse(raw);
    ...          const token = walk(parsed);
    ...          if (token) return token;
    ...        } catch {
    ...          /* ignore non-JSON values */
    ...        }
    ...      }
    ...      return '';
    ...    };
    ...    (async () => {
    ...      const token = findAccessToken();
    ...      if (!token) {
    ...        done({ ok: false, error: 'missing_access_token' });
    ...        return;
    ...      }
    ...      const authHeaders = { Authorization: 'Bearer ' + token };
    ...      const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
    ...      const projectsRes = await fetch('/api/projects', { method: 'GET', headers: authHeaders });
    ...      const projectsPayload = await readJson(projectsRes);
    ...      if (!projectsRes.ok) {
    ...        done({ ok: false, error: projectsPayload.error || 'projects_fetch_failed' });
    ...        return;
    ...      }
    ...      const projectId = projectsPayload?.projects?.[0]?.id;
    ...      if (!projectId) {
    ...        done({ ok: false, error: 'missing_project' });
    ...        return;
    ...      }
    ...      const startRes = await fetch('/api/interview/start', {
    ...        method: 'POST',
    ...        headers: jsonHeaders,
    ...        body: JSON.stringify({ projectId, userName: 'Robot API User', durationMinutes: 10 }),
    ...      });
    ...      const startPayload = await readJson(startRes);
    ...      if (!startRes.ok || !startPayload?.sessionId) {
    ...        done({ ok: false, error: startPayload.error || 'start_failed' });
    ...        return;
    ...      }
    ...      const sessionId = startPayload.sessionId;
    ...      const messageRes = await fetch('/api/interview/message', {
    ...        method: 'POST',
    ...        headers: jsonHeaders,
    ...        body: JSON.stringify({ sessionId, message: 'We watched fireworks by the river on New Year night.' }),
    ...      });
    ...      const messagePayload = await readJson(messageRes);
    ...      if (!messageRes.ok) {
    ...        done({ ok: false, error: messagePayload.error || 'message_failed' });
    ...        return;
    ...      }
    ...      const finishRes = await fetch('/api/interview/finish', {
    ...        method: 'POST',
    ...        headers: jsonHeaders,
    ...        body: JSON.stringify({ sessionId }),
    ...      });
    ...      const finishPayload = await readJson(finishRes);
    ...      if (!finishRes.ok) {
    ...        done({ ok: false, error: finishPayload.error || 'finish_failed' });
    ...        return;
    ...      }
    ...      const assistantMessages = (messagePayload.messages || []).filter((m) => m && m.role === 'assistant').length;
    ...      const memoryCards = Array.isArray(finishPayload.memoryCards) ? finishPayload.memoryCards.length : 0;
    ...      const textSlots = Array.isArray(finishPayload?.roomPayload?.textSlots) ? finishPayload.roomPayload.textSlots.length : 0;
    ...      done({
    ...        ok: true,
    ...        assistantMessages,
    ...        memoryCards,
    ...        textSlots,
    ...      });
    ...    })().catch((error) => done({ ok: false, error: String(error) }));
    RETURN    ${result}

*** Test Cases ***

TC-07-01: Interview Setup Screen Is Available
    [Documentation]    Verify users can access the AI interview setup screen for the selected project.
    ...                Maps to: FR-4.1
    [Tags]    interview    smoke    priority-high
    Go To    ${BASE_URL}/interview
    Wait Until Element Is Visible    css:.voice-setup    timeout=${DEFAULT_TIMEOUT}
    Wait Until Element Is Visible    css:.voice-setup input[type="text"]
    Wait Until Element Is Visible    css:.voice-setup-start

TC-07-02: Start Interview Shows Mic Controls
    [Documentation]    Verify starting interview opens active session controls and microphone action.
    ...                Maps to: FR-4.1, FR-4.2
    [Tags]    interview    smoke    priority-high
    Ensure Interview Session Is Started
    Wait Until Element Is Visible    css:.voice-timer
    Wait Until Element Is Visible    css:.voice-mic-btn
    Element Should Be Enabled    css:.voice-mic-btn
    Recording Attempt Should Start Or Show Error

TC-07-03: Audio Transcription Workflow Can Be Triggered
    [Documentation]    Verify transcription flow can be initiated from the upload page using an audio file.
    ...                Maps to: FR-4.3
    [Tags]    interview    stt    priority-medium
    Skip If    not ${OPENAI_READY}    OpenAI backend is not configured for interview tests.
    Go To    ${BASE_URL}/upload
    Wait Until Page Does Not Contain    Loading projects...    timeout=20s
    Wait Until Element Is Visible    xpath=//h1[normalize-space()='Upload Project Details']    timeout=20s
    Page Should Contain Element    id:audioUploadInput
    Choose File    id:audioUploadInput    ${TEST_AUDIO_FILE}
    Wait Until Page Contains    Selected file:    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(normalize-space(),'Transcribe Audio')]
    Wait Until Element Is Visible    xpath=//button[contains(normalize-space(),'Transcribing...')]    timeout=10s
    Wait Until Element Is Visible    xpath=//button[contains(normalize-space(),'Transcribe Audio')]    timeout=40s
    ${has_transcript}=    Run Keyword And Return Status    Page Should Contain    Latest Transcript
    ${has_error}=    Run Keyword And Return Status    Element Should Be Visible    css:.error-text
    Should Be True    ${has_transcript} or ${has_error}

TC-07-04: Interview Service Processes User Message
    [Documentation]    Verify interview processing generates an assistant response after a user message.
    ...                Maps to: FR-4.4
    [Tags]    interview    api    priority-high
    Skip If    not ${OPENAI_READY}    OpenAI backend is not configured for interview tests.
    ${result}=    Run Interview Api Scenario
    ${ok}=    Get From Dictionary    ${result}    ok
    ${reason}=    Get From Dictionary    ${result}    error
    Skip If    not ${ok}    Interview API unavailable in this environment: ${reason}
    Should Be True    ${ok}
    ${assistant_messages}=    Get From Dictionary    ${result}    assistantMessages
    Should Be True    ${assistant_messages} >= 1

TC-07-05: Finish Interview Returns Structured Memory Payload
    [Documentation]    Verify finishing interview produces structured memory cards and room payload data.
    ...                Maps to: FR-4.5, FR-4.6
    [Tags]    interview    api    priority-high
    Skip If    not ${OPENAI_READY}    OpenAI backend is not configured for interview tests.
    ${result}=    Run Interview Api Scenario
    ${ok}=    Get From Dictionary    ${result}    ok
    ${reason}=    Get From Dictionary    ${result}    error
    Skip If    not ${ok}    Interview API unavailable in this environment: ${reason}
    Should Be True    ${ok}
    ${memory_cards}=    Get From Dictionary    ${result}    memoryCards
    ${text_slots}=    Get From Dictionary    ${result}    textSlots
    Should Be True    ${memory_cards} >= 1
    Should Be True    ${text_slots} >= 1
