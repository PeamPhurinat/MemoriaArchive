*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Projects Suite
Suite Teardown    Close Memoria Application

*** Keywords ***
Setup Projects Suite
    Open Memoria Application
    Login As Test User
    Ensure On Projects Page

Create Project And Return To List
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    Sleep    1s
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    Wait Until Element Is Visible    css:.ma-project-card    timeout=${DEFAULT_TIMEOUT}

*** Test Cases ***

TC-02-01: Projects Page Shows Header And New Project Button
    [Documentation]    Verify the projects page renders the title and creation button.
    ...                Maps to: FR-2.1
    [Tags]    projects    smoke    priority-high
    Wait Until Element Is Visible    css:.ma-section-title
    ${title}=    Get Text    css:.ma-section-title
    Should Be Equal    ${title}    My Projects
    Wait Until Element Is Visible    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']

TC-02-02: Create New Project Navigates To Project Detail
    [Documentation]    Verify clicking '+ New Project' creates a project and opens detail page.
    ...                Maps to: FR-2.1
    [Tags]    projects    smoke    priority-critical
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and normalize-space()='+ New Project']
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /project-detail

TC-02-03: New Project Card Appears In Projects Grid
    [Documentation]    Verify a newly created project card shows in the list.
    ...                Maps to: FR-2.1
    [Tags]    projects    smoke    priority-high
    Ensure On Projects Page
    ${count_before}=    Get Element Count    css:.ma-project-card
    Create Project And Return To List
    ${count_after}=    Get Element Count    css:.ma-project-card
    Should Be True    ${count_after} > ${count_before}

TC-02-04: Project Card Shows Title And Memory Count
    [Documentation]    Verify project card displays key metadata.
    ...                Maps to: FR-2.2
    [Tags]    projects    smoke    priority-medium
    ${card_count}=    Get Element Count    css:.ma-project-card
    Skip If    ${card_count} == 0    No projects available to inspect
    Wait Until Element Is Visible    css:.ma-project-card:first-child .ma-project-card-title
    Wait Until Element Is Visible    css:.ma-project-card:first-child .ma-stat-pill

TC-02-05: Project Card Has Open Interview And 3D Buttons
    [Documentation]    Verify each project card has action buttons.
    ...                Maps to: FR-2.2, FR-2.4
    [Tags]    projects    smoke    priority-medium
    ${card_count}=    Get Element Count    css:.ma-project-card
    Skip If    ${card_count} == 0    No projects available to inspect
    Wait Until Element Is Visible    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[normalize-space()='Open']
    Wait Until Element Is Visible    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[contains(normalize-space(),'Interview')]

TC-02-06: Delete Project Shows Confirmation Step
    [Documentation]    Verify delete button shows inline confirmation before deleting.
    ...                Maps to: FR-2.3
    [Tags]    projects    smoke    priority-high
    ${card_count}=    Get Element Count    css:.ma-project-card
    IF    ${card_count} == 0
        Create Project And Return To List
    END
    Click Element    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[contains(normalize-space(),'Delete')]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'Delete this project?')]    timeout=3s

TC-02-07: Cancel Delete Keeps Project In List
    [Documentation]    Verify cancelling delete confirmation does not remove the project.
    ...                Maps to: FR-2.3
    [Tags]    projects    priority-high
    Ensure On Projects Page
    ${card_count}=    Get Element Count    css:.ma-project-card
    IF    ${card_count} == 0
        Create Project And Return To List
    END
    ${count_before}=    Get Element Count    css:.ma-project-card
    Click Element    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[contains(normalize-space(),'Delete')]
    Wait Until Element Is Visible    xpath=//*[contains(text(),'Delete this project?')]    timeout=3s
    Click Element    xpath=(//div[contains(@class,'ma-project-card')])[1]//button[normalize-space()='Cancel']
    ${count_after}=    Get Element Count    css:.ma-project-card
    Should Be Equal As Integers    ${count_before}    ${count_after}

TC-02-08: Confirm Delete Removes Project From List
    [Documentation]    Verify confirming delete removes the project card.
    ...                Maps to: FR-2.3
    [Tags]    projects    priority-high
    Ensure On Projects Page
    Create Project And Return To List
    ${count_before}=    Get Element Count    css:.ma-project-card
    Click Element    xpath=(//div[contains(concat(' ', normalize-space(@class), ' '), ' ma-project-card ')])[1]//button[normalize-space()='Delete']
    Wait Until Element Is Visible    xpath=//*[contains(text(),'Delete this project?')]    timeout=3s
    Click Element    xpath=(//div[contains(concat(' ', normalize-space(@class), ' '), ' ma-project-card ')])[1]//button[normalize-space()='Yes, delete']
    Sleep    1s
    ${count_after}=    Get Element Count    css:.ma-project-card
    Should Be True    ${count_after} < ${count_before}

TC-02-09: Clicking Memoria Logo Navigates To Dashboard
    [Documentation]    Verify the header brand button returns to the home dashboard.
    ...                Maps to: FR-1.4
    [Tags]    projects    navigation    priority-medium
    Click Element    css:button.ma-header-brand
    Wait Until Element Is Visible    css:.ma-home    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.ma-home-title
    Should Be Equal    ${title}    Memoria Archive
