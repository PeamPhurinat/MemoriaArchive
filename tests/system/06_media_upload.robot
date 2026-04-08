*** Settings ***
Resource          resources/common.resource
Suite Setup       Setup Media Upload Suite
Suite Teardown    Close Memoria Application

*** Variables ***
${TEST_IMAGE_FILE}    ${CURDIR}/resources/assets/test-image.png
${TEST_VIDEO_FILE}    ${CURDIR}/resources/assets/test-video.mp4

*** Keywords ***
Setup Media Upload Suite
    Open Memoria Application
    Login As Test User
    Create Fresh Project
    Ensure At Least N Memories    1

Element Count Should Be Greater Than
    [Arguments]    ${locator}    ${threshold}
    ${count}=    Get Element Count    ${locator}
    Should Be True    ${count} > ${threshold}

Element Count Should Be Less Than
    [Arguments]    ${locator}    ${threshold}
    ${count}=    Get Element Count    ${locator}
    Should Be True    ${count} < ${threshold}

*** Test Cases ***

TC-06-01: Upload Photo To Memory Slot
    [Documentation]    Verify users can upload a photo into a memory slot.
    ...                Maps to: FR-3.1
    [Tags]    media    upload    smoke    priority-high
    Choose File    xpath=(//div[contains(@class,'ma-memory-item')])[1]//input[@type='file' and contains(@accept,'image/')]    ${TEST_IMAGE_FILE}
    Wait Until Keyword Succeeds    20s    500ms    Element Should Be Visible    xpath=(//div[contains(@class,'ma-memory-item')])[1]//label[contains(@class,'ma-memory-photo')][1]//img

TC-06-02: Upload Video To Memory Slot
    [Documentation]    Verify users can upload a video into a memory slot.
    ...                Maps to: FR-3.2
    [Tags]    media    upload    smoke    priority-high
    Choose File    xpath=(//div[contains(@class,'ma-memory-item')])[1]//input[@type='file' and contains(@accept,'video/')]    ${TEST_VIDEO_FILE}
    Wait Until Keyword Succeeds    20s    500ms    Element Should Be Visible    xpath=(//div[contains(@class,'ma-memory-item')])[1]//label[contains(@class,'ma-memory-photo')][2]//video

TC-06-03: Add Text Memory Slot
    [Documentation]    Verify users can add a new text memory slot.
    ...                Maps to: FR-3.3
    [Tags]    media    text    priority-medium
    ${count_before}=    Get Element Count    css:.ma-memory-item
    Click Element    xpath=//div[contains(@class,'ma-memories-header')][.//span[contains(normalize-space(),'Memories')]]//button[normalize-space()='+ Add']
    Wait Until Keyword Succeeds    8s    300ms    Element Count Should Be Greater Than    css:.ma-memory-item    ${count_before}

TC-06-04: Edit Memory Text Fields
    [Documentation]    Verify users can edit memory title and description content.
    ...                Maps to: FR-3.4
    [Tags]    media    text    priority-medium
    Ensure At Least N Memories    1
    Input Text    css:.ma-memory-item:first-child .ma-memory-title-input    Edited memory title
    Input Text    css:.ma-memory-item:first-child .ma-memory-desc-input    Edited memory description for validation.
    ${title_value}=    Get Value    css:.ma-memory-item:first-child .ma-memory-title-input
    ${desc_value}=    Get Value    css:.ma-memory-item:first-child .ma-memory-desc-input
    Should Be Equal    ${title_value}    Edited memory title
    Should Be Equal    ${desc_value}    Edited memory description for validation.

TC-06-05: Delete Memory Content
    [Documentation]    Verify users can delete memory content before final visualization.
    ...                Maps to: FR-3.5
    [Tags]    media    text    priority-medium
    Ensure At Least N Memories    2
    ${count_before}=    Get Element Count    css:.ma-memory-item
    Click Element    css:.ma-memory-item:last-child .ma-memory-delete
    Wait Until Keyword Succeeds    8s    300ms    Element Count Should Be Less Than    css:.ma-memory-item    ${count_before}
