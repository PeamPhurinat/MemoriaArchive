*** Settings ***
Resource          resources/common.resource
Suite Setup       Open Memoria Application
Suite Teardown    Close Memoria Application
Test Setup        Navigate To Auth Page

*** Test Cases ***

TC-01-01: Auth Page Displays Sign In Form By Default
    [Documentation]    Verify the auth page loads with Sign In mode active.
    ...                Maps to: FR-1.2
    [Tags]    auth    smoke    priority-high
    Wait Until Element Is Visible    css:.ma-auth-title
    ${title}=    Get Text    css:.ma-auth-title
    Should Be Equal    ${title}    Welcome back
    Wait Until Element Is Visible    id:auth-email
    Wait Until Element Is Visible    id:auth-password
    Wait Until Element Is Visible    css:button.ma-auth-submit

TC-01-02: Switch To Sign Up Mode
    [Documentation]    Verify clicking the footer sign-up link changes form title and button label.
    ...                Maps to: FR-1.1
    [Tags]    auth    smoke    priority-high
    Click Element    xpath=//button[contains(@class,'ma-auth-footer-link') and normalize-space()='Create one']
    ${title}=    Get Text    css:.ma-auth-title
    Should Be Equal    ${title}    Create account
    ${submit}=    Get Text    css:button.ma-auth-submit
    Should Be Equal    ${submit}    Create account

TC-01-03: Sign Up With Invalid Email Format Shows Browser Validation
    [Documentation]    Verify HTML5 email validation prevents submission with bad email.
    ...                Maps to: FR-1.1
    [Tags]    auth    validation    priority-high
    Click Element    xpath=//button[contains(@class,'ma-auth-footer-link') and normalize-space()='Create one']
    Input Text      id:auth-email       not-an-email
    Input Password  id:auth-password    TestPass123!
    Input Password  id:auth-confirm-password    TestPass123!
    Click Element   css:button.ma-auth-submit
    Location Should Be    ${BASE_URL}/auth

TC-01-04: Sign Up With Password Too Short Shows Browser Validation
    [Documentation]    Verify minLength=6 on password input prevents weak password submit.
    ...                Maps to: FR-1.1
    [Tags]    auth    validation    priority-medium
    Click Element    xpath=//button[contains(@class,'ma-auth-footer-link') and normalize-space()='Create one']
    Input Text      id:auth-email       valid@example.com
    Input Password  id:auth-password    abc
    Input Password  id:auth-confirm-password    abc
    Click Element   css:button.ma-auth-submit
    Location Should Be    ${BASE_URL}/auth

TC-01-05: Sign In With Wrong Password Shows Error Message
    [Documentation]    Verify that wrong credentials display an error.
    ...                Maps to: FR-1.2
    [Tags]    auth    negative    priority-high
    Input Text      id:auth-email       ${TEST_EMAIL}
    Input Password  id:auth-password    WrongPassword999
    Click Element   css:button.ma-auth-submit
    Wait Until Element Is Visible    css:.ma-auth-error    timeout=8s
    ${error}=    Get Text    css:.ma-auth-error
    Should Not Be Empty    ${error}
    Location Should Be    ${BASE_URL}/auth

TC-01-06: Sign In With Empty Email Shows Browser Validation
    [Documentation]    Verify required attribute on email input prevents blank submit.
    ...                Maps to: FR-1.2
    [Tags]    auth    validation    priority-medium
    Input Password  id:auth-password    SomePass123
    Click Element   css:button.ma-auth-submit
    Location Should Be    ${BASE_URL}/auth

TC-01-07: Successful Sign In Redirects To Dashboard
    [Documentation]    Verify a valid login lands the user on the home dashboard.
    ...                Maps to: FR-1.2
    [Tags]    auth    smoke    priority-critical
    Input Text      id:auth-email       ${TEST_EMAIL}
    Input Password  id:auth-password    ${TEST_PASSWORD}
    Click Element   css:button.ma-auth-submit
    Wait Until Element Is Visible    css:.ma-home    timeout=${DEFAULT_TIMEOUT}
    ${title}=    Get Text    css:.ma-home-title
    Should Be Equal    ${title}    Memoria Archive

TC-01-08: Authenticated User Cannot Access Auth Page
    [Documentation]    Verify that already-logged-in users are redirected away from /auth.
    ...                Maps to: FR-1.4
    [Tags]    auth    security    priority-high
    # Override suite-level Test Setup — no need to navigate to auth first
    [Setup]    No Operation
    Login As Test User
    Go To    ${BASE_URL}/auth
    Wait Until Element Is Visible    css:.ma-home    timeout=${DEFAULT_TIMEOUT}
    ${loc}=    Get Location
    Should Not Contain    ${loc}    /auth
