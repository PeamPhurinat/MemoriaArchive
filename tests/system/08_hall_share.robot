*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Hall Share Suite
Suite Teardown    Close Memoria Application

*** Keywords ***
Setup Hall Share Suite
    Open Memoria Application
    Login As Test User
    Create Fresh Project
    Prepare Active Project For Review
    Set Suite Variable    ${SHARE_URL}    ${EMPTY}

Ensure Memory Hall Is Open
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    ${can_open_directly}=    Run Keyword And Return Status    Page Should Contain Element    xpath=//button[contains(normalize-space(),'Open 3D Room')]
    IF    ${can_open_directly}
        Click Element    xpath=//button[contains(normalize-space(),'Open 3D Room')]
    ELSE
        Click Element    xpath=//button[contains(normalize-space(),'Review') and contains(normalize-space(),'3D')]
        Wait Until Element Is Visible    css:.page-title    timeout=${DEFAULT_TIMEOUT}
        Wait Until Element Is Enabled    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']    timeout=${DEFAULT_TIMEOUT}
        Click Element    xpath=//button[contains(@class,'primary') and normalize-space()='Generate 3D Room']
    END
    Wait Until Element Is Visible    css:.launch    timeout=20s
    Location Should Contain    /memory-hall

Ensure Custom Mode Is Enabled
    ${menu_opened}=    Run Keyword And Return Status    Element Should Be Visible    css:.mode-toggle
    IF    not ${menu_opened}
        Click Element    css:.menu-toggle
        Wait Until Element Is Visible    css:.mode-toggle    timeout=${DEFAULT_TIMEOUT}
    END
    ${custom_visible}=    Run Keyword And Return Status    Element Should Be Visible    css:.custom-panel.is-visible
    IF    not ${custom_visible}
        Click Element    css:.mode-toggle
        Wait Until Element Is Visible    css:.custom-panel.is-visible    timeout=${DEFAULT_TIMEOUT}
    END

Capture Active Project Share URL
    Go To    ${BASE_URL}/project-detail
    Wait Until Element Is Visible    css:.ma-project-title-input    timeout=${DEFAULT_TIMEOUT}
    ${share_input_visible}=    Run Keyword And Return Status    Element Should Be Visible    css:.ma-share-input
    IF    not ${share_input_visible}
        Click Element    xpath=//button[contains(@class,'ma-btn') and (contains(normalize-space(),'Share') or contains(normalize-space(),'Shared'))]
        Wait Until Element Is Visible    css:.ma-share-input    timeout=${DEFAULT_TIMEOUT}
    END
    ${url}=    Get Value    css:.ma-share-input
    Should Contain    ${url}    /view/
    Set Suite Variable    ${SHARE_URL}    ${url}

*** Test Cases ***

TC-08-01: Memory Hall Shows Explore Controls
    [Documentation]    Verify users can open and explore the generated 3D memory room.
    ...                Maps to: FR-5.5
    [Tags]    hall    smoke    priority-high
    Ensure Memory Hall Is Open
    Wait Until Element Is Visible    css:.launch    timeout=20s
    Wait Until Element Is Visible    css:.back-to-project
    Wait Until Element Is Visible    css:.menu-toggle

TC-08-02: Custom Mode Shows Layout Editing Tools
    [Documentation]    Verify custom mode exposes 3D layout customization controls.
    ...                Maps to: FR-6.1
    [Tags]    hall    custom    priority-high
    Ensure Memory Hall Is Open
    Ensure Custom Mode Is Enabled
    Wait Until Element Is Visible    css:.tool-move
    Wait Until Element Is Visible    css:.tool-resize
    Wait Until Element Is Visible    css:.tool-delete

TC-08-03: Save And Load Layout Controls Are Available
    [Documentation]    Verify save and load layout actions are available in custom mode.
    ...                Maps to: FR-6.2
    [Tags]    hall    custom    priority-high
    Ensure Memory Hall Is Open
    Ensure Custom Mode Is Enabled
    Wait Until Element Is Visible    css:.tool-save
    Wait Until Element Is Visible    css:.tool-load
    Element Should Be Enabled    css:.tool-save
    Element Should Be Enabled    css:.tool-load
    Wait Until Element Is Visible    css:.custom-status

TC-08-04: Export Walkthrough Button Is Visible
    [Documentation]    Verify users can access walkthrough video export action in 3D room.
    ...                Maps to: FR-6.5
    [Tags]    hall    export    priority-high
    Ensure Memory Hall Is Open
    Wait Until Element Is Visible    css:.wt-export-btn    timeout=20s
    ${export_text}=    Get Text    css:.wt-export-btn
    Should Contain    ${export_text}    Export Video

TC-08-05: Share Toggle Reveals Public Link
    [Documentation]    Verify users can enable sharing and get a public read-only link.
    ...                Maps to: FR-6.3
    [Tags]    hall    share    priority-high
    Capture Active Project Share URL
    Should Not Be Empty    ${SHARE_URL}

TC-08-06: Public Shared Link Opens Read-Only View
    [Documentation]    Verify a shared project opens in public read-only mode for viewers.
    ...                Maps to: FR-6.4
    [Tags]    hall    share    priority-high
    Skip If    '${SHARE_URL}' == ''    Share URL was not prepared by previous step.
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='Sign Out']    timeout=${DEFAULT_TIMEOUT}
    Click Element    xpath=//button[contains(@class,'ma-btn-ghost') and normalize-space()='Sign Out']
    Wait Until Element Is Visible    css:.ma-auth-card    timeout=${DEFAULT_TIMEOUT}
    Go To    ${SHARE_URL}
    Wait Until Element Is Visible    css:.memory-hall-root    timeout=20s
    Wait Until Element Is Visible    css:.launch    timeout=20s
    Element Should Not Be Visible    css:.mode-toggle
