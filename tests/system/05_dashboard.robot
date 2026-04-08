*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Dashboard Suite
Suite Teardown    Close Memoria Application

*** Keywords ***
Setup Dashboard Suite
    Open Memoria Application
    Login As Test User

*** Test Cases ***

TC-05-01: Dashboard Shows Memoria Archive Title
    [Documentation]    Verify the home dashboard displays the app title.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    smoke    priority-high
    Wait Until Element Is Visible    css:.ma-home-title    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.ma-home-title
    Should Be Equal    ${title}    Memoria Archive

TC-05-02: Dashboard Shows My Projects Button
    [Documentation]    Verify the My Projects button is visible on the dashboard.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    smoke    priority-high
    Wait Until Element Is Visible    xpath=//button[contains(@class,'ma-btn-primary') and contains(normalize-space(),'My Projects')]

TC-05-03: Dashboard Shows Sign Out Button
    [Documentation]    Verify the Sign Out button is visible for authenticated users.
    ...                Maps to: FR-1.3
    [Tags]    dashboard    smoke    priority-high
    Wait Until Element Is Visible    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='Sign Out']

TC-05-04: My Projects Button Navigates To Projects Page
    [Documentation]    Verify clicking My Projects navigates to /projects.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    smoke    priority-critical
    Click Element    xpath=//button[contains(@class,'ma-btn-primary') and contains(normalize-space(),'My Projects')]
    Wait Until Element Is Visible    css:.ma-section-title    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.ma-section-title
    Should Be Equal    ${title}    My Projects
    Location Should Contain    /projects

TC-05-05: Sign Out Button Logs Out And Redirects To Auth Page
    [Documentation]    Verify clicking Sign Out terminates the session and redirects to /auth.
    ...                Maps to: FR-1.3
    [Tags]    dashboard    smoke    priority-critical
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:.ma-home    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='Sign Out']
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /auth

TC-05-06: Unauthenticated User Redirected From Dashboard To Auth
    [Documentation]    Verify that accessing / without a session redirects to /auth.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    security    priority-high
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /auth

TC-05-07: Unauthenticated User Redirected From Projects To Auth
    [Documentation]    Verify that /projects is protected and redirects unauthenticated users.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    security    priority-high
    Go To    ${BASE_URL}/projects
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /auth

TC-05-08: Unauthenticated User Redirected From Review To Auth
    [Documentation]    Verify that /review is protected and redirects unauthenticated users.
    ...                Maps to: FR-1.4
    [Tags]    dashboard    security    priority-high
    Go To    ${BASE_URL}/review
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}
    Location Should Contain    /auth
