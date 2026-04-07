*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Project Detail Suite
Suite Teardown    Close Memoria Application

*** Keywords ***
Setup Project Detail Suite
    Open Memoria Application
    Login As Test User
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    Wait Until Page Does Not Contain    Loading projects...    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    # Ensure predictable baseline for this suite.
    FOR    ${i}    IN RANGE    12
        ${count}=    Get Element Count    css:.ma-memory-item
        Exit For Loop If    ${count} == 0
        Click Element    css:.ma-memory-item:last-child .ma-memory-delete
        Sleep    500ms
    END

Go To Active Project Detail
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}

*** Test Cases ***

TC-03-01: Project Detail Page Loads With Title Input
    [Documentation]    Verify the project detail page renders the editable title field.
    ...                Maps to: FR-2.3
    [Tags]    detail    smoke    priority-high
    Wait Until Element Is Visible    css:.ma-project-title-input
    Wait Until Element Is Visible    xpath=//button[contains(normalize-space(),'AI Interview')]

TC-03-02: Edit Project Title Updates The Input
    [Documentation]    Verify typing in the title input updates the value.
    ...                Maps to: FR-2.4
    [Tags]    detail    smoke    priority-high
    Clear Element Text    css:.ma-project-title-input
    Input Text    css:.ma-project-title-input    My Honeymoon Trip
    ${value}=    Get Value    css:.ma-project-title-input
    Should Be Equal    ${value}    My Honeymoon Trip

TC-03-03: Save Toast Appears After Editing Title
    [Documentation]    Verify that editing the project title triggers the saved indicator.
    ...                Maps to: FR-2.5
    [Tags]    detail    priority-medium
    Clear Element Text    css:.ma-project-title-input
    Input Text    css:.ma-project-title-input    Updated Title
    Wait Until Element Is Visible    css:.ma-save-toast.visible    timeout=3s

TC-03-04: Add Memory Button Creates New Memory Item
    [Documentation]    Verify clicking '+ Add' adds a memory slot to the list.
    ...                Maps to: FR-3.3
    [Tags]    detail    smoke    priority-critical
    Go To Active Project Detail
    ${count_before}=    Get Element Count    css:.ma-memory-item
    Wait Until Element Is Enabled    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
    Wait Until Keyword Succeeds    5s    300ms    Element Should Be Visible    css:.ma-memory-item
    ${count_after}=    Get Element Count    css:.ma-memory-item
    Should Be True    ${count_after} > ${count_before}

TC-03-05: Memory Title Input Accepts Text
    [Documentation]    Verify that a memory's title field accepts text input.
    ...                Maps to: FR-3.4
    [Tags]    detail    smoke    priority-high
    ${count}=    Get Element Count    css:.ma-memory-item
    IF    ${count} == 0
        Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Sleep    500ms
    END
    Input Text    css:.ma-memory-item:first-child .ma-memory-title-input    First date
    ${value}=    Get Value    css:.ma-memory-item:first-child .ma-memory-title-input
    Should Be Equal    ${value}    First date

TC-03-06: Memory Description Textarea Accepts Text
    [Documentation]    Verify that a memory's description textarea accepts text.
    ...                Maps to: FR-3.4
    [Tags]    detail    priority-medium
    ${count}=    Get Element Count    css:.ma-memory-item
    IF    ${count} == 0
        Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Sleep    500ms
    END
    Input Text    css:.ma-memory-item:first-child .ma-memory-desc-input    It was a beautiful evening.
    ${value}=    Get Value    css:.ma-memory-item:first-child .ma-memory-desc-input
    Should Be Equal    ${value}    It was a beautiful evening.

TC-03-07: Delete Memory Button Removes Memory Item
    [Documentation]    Verify clicking ✕ on a memory removes it from the list.
    ...                Maps to: FR-3.5
    [Tags]    detail    priority-high
    ${count}=    Get Element Count    css:.ma-memory-item
    IF    ${count} == 0
        Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Sleep    800ms
    END
    ${count_before}=    Get Element Count    css:.ma-memory-item
    Click Element    css:.ma-memory-item:last-child .ma-memory-delete
    Sleep    800ms
    ${count_after}=    Get Element Count    css:.ma-memory-item
    Should Be True    ${count_after} < ${count_before}

TC-03-08: Add Memory Button Disabled At 8 Memories
    [Documentation]    Verify that the Add button becomes disabled after 8 memories are added.
    ...                Maps to: FR-3.3
    [Tags]    detail    validation    priority-medium
    Go To Active Project Detail
    FOR    ${i}    IN RANGE    16
        ${count}=    Get Element Count    css:.ma-memory-item
        Exit For Loop If    ${count} >= 8
        ${btn_enabled}=    Run Keyword And Return Status    Element Should Be Enabled    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Exit For Loop If    not ${btn_enabled}
        Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
        Sleep    800ms
    END
    ${final_count}=    Get Element Count    css:.ma-memory-item
    Should Be True    ${final_count} >= 8
    Wait Until Keyword Succeeds    4s    300ms    Element Should Be Disabled    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']

TC-03-09: Move Memory Up Button Disabled For First Memory
    [Documentation]    Verify the ↑ button is disabled for the first memory in the list.
    ...                Maps to: FR-3.4
    [Tags]    detail    priority-medium
    ${count}=    Get Element Count    css:.ma-memory-item
    Skip If    ${count} == 0    No memories to test
    Element Should Be Disabled    css:.ma-memory-item:first-child [aria-label="Move memory up"]

TC-03-10: Move Memory Down Button Disabled For Last Memory
    [Documentation]    Verify the ↓ button is disabled for the last memory in the list.
    ...                Maps to: FR-3.4
    [Tags]    detail    priority-medium
    ${count}=    Get Element Count    css:.ma-memory-item
    Skip If    ${count} == 0    No memories to test
    Element Should Be Disabled    css:.ma-memory-item:last-child [aria-label="Move memory down"]

TC-03-11: My Projects Back Link Returns To Projects Page
    [Documentation]    Verify the '← My Projects' back link navigates correctly.
    ...                Maps to: FR-2.3
    [Tags]    detail    navigation    priority-low
    # Scroll to top first so header doesn't intercept the click
    Execute Javascript    window.scrollTo(0, 0)
    Sleep    300ms
    Execute Javascript    document.querySelector('.ma-back-link').click()
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.ma-section-title
    Should Be Equal    ${title}    My Projects

TC-03-12: Navigate To AI Interview Button Goes To Interview Page
    [Documentation]    Verify clicking 🎤 AI Interview navigates to /interview.
    ...                Maps to: FR-4.1
    [Tags]    detail    navigation    priority-high
    # Go to projects and open the first project to ensure active project is set
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    ${card_count}=    Get Element Count    css:.ma-project-card
    IF    ${card_count} == 0
        Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
        Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    ELSE
        Click Element    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[normalize-space()='Open']
        Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    END
    Click Element    xpath=//button[contains(normalize-space(),'AI Interview')]
    Sleep    2s
    Location Should Contain    /interview
