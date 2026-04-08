*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Review Suite
Suite Teardown    Close Memoria Application

*** Keywords ***
Setup Review Suite
    Open Memoria Application
    Login As Test User
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    Wait Until Page Does Not Contain    Loading projects...    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    Sleep    500ms
    # Wait for the + Add button to be enabled, then click it
    Wait Until Element Is Enabled    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='+ Add']    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='+ Add']
    # Wait for the memory item to render in React
    Wait Until Element Is Visible    css:.ma-memory-item    timeout=${DEFAULT_TIMEOUT}
    Sleep    300ms
    Input Text    css:.ma-memory-item:first-child .ma-memory-title-input    Our First Date
    Sleep    200ms
    Input Text    css:.ma-memory-item:first-child .ma-memory-desc-input    A rainy evening in Bangkok.
    # Wait for debounce save (450ms) + backend round-trip before navigating
    Sleep    2s
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}

Navigate To Fresh Empty Project Review
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    Wait Until Page Does Not Contain    Loading projects...    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    Sleep    1s
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}

*** Test Cases ***

TC-04-01: Review Page Shows Title And Subtitle
    [Documentation]    Verify the review page loads with its title and subtitle.
    ...                Maps to: FR-5.1
    [Tags]    review    smoke    priority-high
    Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.page-title
    Should Be Equal    ${title}    Review Project
    Wait Until Element Is Visible    css:.page-subtitle

TC-04-02: Review Page Shows Memories Section
    [Documentation]    Verify memories added in the detail page appear in the review.
    ...                Maps to: FR-5.1
    [Tags]    review    smoke    priority-high
    Wait Until Element Is Visible    xpath=//h2[normalize-space()='Text Memories']
    Wait Until Element Is Visible    css:.memory-card

TC-04-03: Review Page Shows Photos Section
    [Documentation]    Verify the Photos section is rendered on the review page.
    ...                Maps to: FR-5.1
    [Tags]    review    smoke    priority-medium
    Wait Until Element Is Visible    xpath=//h2[normalize-space()='Photos']

TC-04-04: Review Page Shows Videos Section
    [Documentation]    Verify the Videos section is rendered on the review page.
    ...                Maps to: FR-5.1
    [Tags]    review    smoke    priority-medium
    Wait Until Element Is Visible    xpath=//h2[normalize-space()='Videos']

TC-04-05: Review Page Does Not Show Audio Transcripts Section
    [Documentation]    Verify the Audio Transcripts section is not rendered.
    ...                Maps to: FR-5.1
    [Tags]    review    smoke    priority-medium
    Page Should Not Contain Element    xpath=//h2[normalize-space()='Audio Transcripts']

TC-04-06: Generate 3D Room Button Is Enabled When Content Exists
    [Documentation]    Verify the Generate 3D Room button is clickable when there is content.
    ...                Maps to: FR-5.3, FR-5.4
    [Tags]    review    smoke    priority-critical
    Element Should Be Enabled    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']

TC-04-07: Generate 3D Room Button Is Disabled With No Content
    [Documentation]    Verify the Generate 3D Room button is disabled on an empty project.
    ...                Maps to: FR-5.3
    [Tags]    review    validation    priority-high
    Navigate To Fresh Empty Project Review
    Element Should Be Disabled    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']
    Wait Until Element Is Visible    css:.error-text

TC-04-08: Move Memory Up Arrow Reorders Memories
    [Documentation]    Verify clicking ↑ on a non-first memory moves it up in the list.
    ...                Maps to: FR-5.2
    [Tags]    review    priority-high
    # Add a second memory via project detail, wait for save, then go to review
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    ${count}=    Get Element Count    css:.ma-memory-item
    IF    ${count} < 2
        Click Element    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='+ Add']
        Wait Until Element Is Visible    css:.ma-memory-item    timeout=5s
        Sleep    300ms
        Input Text    css:.ma-memory-item:last-child .ma-memory-title-input    Second Memory
        Wait Until Element Is Visible    css:.ma-save-toast.visible    timeout=5s
        Sleep    1s
    END
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    xpath=//h2[normalize-space()='Text Memories']    timeout=${DEFAULT_TIMEOUT}
    ${card_count}=    Get Element Count    xpath=//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')]
    Skip If    ${card_count} < 2    Need at least 2 memories to test reorder
    ${title_before}=    Get Text    xpath=(//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')])[2]//strong
    Click Element    xpath=(//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')])[2]//*[@aria-label='Move memory up']
    ${title_after}=    Get Text    xpath=(//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')])[2]//strong
    Should Not Be Equal    ${title_before}    ${title_after}

TC-04-09: Move Up Arrow Disabled For First Memory
    [Documentation]    Verify ↑ button is disabled for the first memory in the review list.
    ...                Maps to: FR-5.2
    [Tags]    review    priority-medium
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}
    ${card_count}=    Get Element Count    xpath=//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')]
    Skip If    ${card_count} == 0    No memories in review
    Element Should Be Disabled    xpath=(//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')])[1]//*[@aria-label='Move memory up']

TC-04-10: Move Down Arrow Disabled For Last Memory
    [Documentation]    Verify ↓ button is disabled for the last memory in the review list.
    ...                Maps to: FR-5.2
    [Tags]    review    priority-medium
    ${card_count}=    Get Element Count    xpath=//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')]
    Skip If    ${card_count} == 0    No memories in review
    Element Should Be Disabled    xpath=(//h2[normalize-space()='Text Memories']/following-sibling::div[contains(@class,'memory-list')][1]/div[contains(@class,'memory-card')])[last()]//*[@aria-label='Move memory down']

TC-04-11: Back To Edit Button Navigates To Project Detail
    [Documentation]    Verify the 'Back to Edit' button returns to /project-detail.
    ...                Maps to: FR-5.1
    [Tags]    review    navigation    priority-medium
    Click Element    xpath=//button[@class='button' and normalize-space()='Back to Edit']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /project-detail

TC-04-12: Generate 3D Room Navigates To Memory Hall
    [Documentation]    Verify clicking Generate 3D Room redirects to /memory-hall.
    ...                Maps to: FR-5.4
    [Tags]    review    smoke    priority-critical
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    ${count}=    Get Element Count    css:.ma-memory-item
    IF    ${count} == 0
        Click Element    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='+ Add']
        Wait Until Element Is Visible    css:.ma-memory-item    timeout=5s
        Wait Until Element Is Visible    css:.ma-memory-item:first-child .ma-memory-title-input    timeout=5s
        Input Text    css:.ma-memory-item:first-child .ma-memory-title-input    Memory for 3D
        Wait Until Element Is Visible    css:.ma-save-toast.visible    timeout=5s
        Sleep    1s
    END
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']    timeout=${DEFAULT_TIMEOUT}
    Element Should Be Enabled    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']
    Click Element    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']
    Sleep    2s
    Location Should Contain    /memory-hall
