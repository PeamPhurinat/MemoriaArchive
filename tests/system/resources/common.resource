*** Settings ***
Library     SeleniumLibrary
Library     Collections
Library     String

*** Variables ***
${BASE_URL}           http://localhost:3000
${BROWSER}            headlesschrome
${DEFAULT_TIMEOUT}    10s
${TEST_EMAIL}         testuser@memoriaarchive.test
${TEST_PASSWORD}      TestPass123!

*** Keywords ***
Open Memoria Application
    Open Browser    ${BASE_URL}    ${BROWSER}
    Set Selenium Timeout    ${DEFAULT_TIMEOUT}

Close Memoria Application
    Close All Browsers

Navigate To Auth Page
    Go To    ${BASE_URL}/auth
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}

Login As Test User
    # If already logged in, skip auth; otherwise sign in normally
    Go To    ${BASE_URL}/auth
    ${on_auth}=    Run Keyword And Return Status    Wait Until Element Is Visible    css:.ma-auth-card    timeout=4s
    IF    ${on_auth}
        Click Element    xpath=//button[contains(@class,'ma-auth-mode') and normalize-space()='Sign In']
        Input Text      id:auth-email       ${TEST_EMAIL}
        Input Password  id:auth-password    ${TEST_PASSWORD}
        Click Element   css:button.ma-auth-submit
    END
    Wait Until Element Is Visible    css:.ma-home    timeout=${DEFAULT_TIMEOUT}

Ensure On Projects Page
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}

Create Fresh Project
    Ensure On Projects Page
    Wait Until Page Does Not Contain    Loading projects...    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}

Ensure Active Project Detail
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}

Ensure At Least N Memories
    [Arguments]    ${target_count}=1
    Ensure Active Project Detail
    FOR    ${i}    IN RANGE    24
        ${count}=    Get Element Count    css:.ma-memory-item
        Exit For Loop If    ${count} >= ${target_count}
        Wait Until Element Is Enabled    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']    timeout=${DEFAULT_TIMEOUT}
        Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Sleep    300ms
    END
    ${final_count}=    Get Element Count    css:.ma-memory-item
    Should Be True    ${final_count} >= ${target_count}

Prepare Active Project For Review
    Ensure At Least N Memories    1
    Input Text    css:.ma-memory-item:first-child .ma-memory-title-input    Test Memory
    Input Text    css:.ma-memory-item:first-child .ma-memory-desc-input    This memory is prepared for review and 3D generation.
    Sleep    2s
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}

Prepare Active Project For Memory Hall
    Prepare Active Project For Review
    Wait Until Element Is Enabled    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']
    Wait Until Element Is Visible    css:.launch    timeout=20s
    Location Should Contain    /memory-hall

Get API Health Flag
    [Arguments]    ${field_name}
    ${value}=    Execute Async Javascript
    ...    const fieldName = '${field_name}';
    ...    const done = arguments[arguments.length - 1];
    ...    fetch('/api/health')
    ...      .then((response) => response.json())
    ...      .then((payload) => done(Boolean(payload && payload[fieldName])))
    ...      .catch(() => done(false));
    RETURN    ${value}
