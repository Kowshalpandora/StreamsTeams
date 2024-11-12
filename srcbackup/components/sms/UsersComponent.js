import React, { useEffect, useState, useRef } from 'react'
import { MDBAccordion, MDBAccordionItem, MDBBadge, MDBChip, MDBIcon, MDBInput, MDBTabs, MDBTabsContent, MDBTabsItem, MDBTabsLink, MDBTabsPane } from 'mdb-react-ui-kit'
import { dialpad, Group, Iconsearch, Profile, Settings } from '../../assets/images'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate } from 'react-router-dom'
import { isIOS, isAndroid, isMobile } from 'react-device-detect';

import Constants from "../../config/Constants"
import evntEmitter from "../../classes/utils/EvntEmitter"
import EmitterConstants from "../../config/EmitterConstants"
import MessageHandler from "../../classes/chat/MessageHandler"
import SettingsHandler from "../../classes/settings/SettingsHandler"
import ChatComponents from '../chats/ChatComponent'
import StreamsHandler from '../../classes/chat/StreamsHandler'
import MessaageConstants from '../../config/MessaageConstants'
import Utils from '../../classes/utils/util'
import Header from '../utils/Header';
import IMConstants from '../../config/IMConstants';
import DialPad from '../home/DialPad'
import Contacts from '../home/Contacts'
import Recents from '../home/Recents'

let selectedTabIndex = Constants.REQ_SMS_TAB_TYPE.ALL_SMS;
let loadMoreStatus = false;

let TAG = "[UsersComponent].";
const UsersComponent = ({ onLoad, onClickGroup, onClickSMSDID, onSelectIndividualSMS, dailpadNumberClick, onClickRecents }) => {

    const [sms_enable_status, setSMSEnableStatus] = useState(true);
    const [loading, setLoading] = useState(false);//This is to show the loading indicator for load more data
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingNew, setLoadingNew] = useState(true);
    const [isPopUpVisible, setPopUpVisible] = useState(false);

    const [smsIndividualList, setSMSIndividualList] = useState([]);
    const [smsGroupsList, setSMSGroupsList] = useState([]);
    const [tempAllSMSList, setTempAllSMSList] = useState([]);
    const [allSMSList, setAllSMSList] = useState([]);
    const [final_data, setFinalData] = useState([]);
    const [tempBuddiesList, setTempBuddiesList] = useState([]);
    const [searchBuddilesList, setSearchBuddiesList] = useState([]);

    const [smsPopupInputs, setSMSPopupInputs] = useState({});

    const [searchString, setSearchString] = useState("");
    const [selectedTab, setSelectedTab] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState();
    const [selectMainTab, setMainTabActive] = useState('recents');

    const [individualUnreadCount, setIndividualUnreadCount] = useState();
    const [allUnreadCount, setallUnreadCount] = useState();

    const containerRef = useRef(null);
    const navigate = useNavigate();

    var buddy_data = final_data.filter((data) => {
        //return (data.title ? data.title : data.phnumber).toLowerCase().includes(searchString.toLowerCase())
    });

    useEffect(() => {

        //onLoad();

    }, [onLoad]);

    useEffect(() => {

        console.log('[UsersComponents].useEffect() in statement -[]---');

        try {

            let sms_enable_status = localStorage.getItem(Constants.WS_KEY_SMS_ENABLED_STATUS);
            setSMSEnableStatus(sms_enable_status);

            console.log('[UsersComponents].useEffect() in statement -[onLoad]--- sms_enable_status :: ' + sms_enable_status);

            if (sms_enable_status) {

                SettingsHandler.loadSMSGroupAssignedDIDList();
                SettingsHandler.loadSMSData(searchString, selectedTabIndex);

                unRegisterEmitters();
                registerEmitters();
            }

            loadDataFromServer();

            const container = containerRef.current;
            if (container) {
                container.addEventListener("scroll", debouncedHandleScroll);
            }

            return () => {

                if (container) {
                    container.removeEventListener("scroll", debouncedHandleScroll);
                }
            };

        } catch (e) {

            console.log("Error in [UsersComponents].useEffect() :: " + e);
        }

    }, [])

    const unRegisterEmitters = () => {

        try {

            evntEmitter.removeAllListeners(EmitterConstants.EMMIT_ON_SMS_GROUPS_RECEIVED);
            evntEmitter.removeAllListeners(EmitterConstants.EMMIT_ON_SMS_SETTINGS_RECEIVED);
        } catch (e) {

            console.log('[unRegisterEmitters] Error :: ' + e);
        }
    }

    const loadDataFromServer = () => {

        try {

            console.log(TAG + "[loadDataFromServer] ------------");

            SettingsHandler.loadCompanyContacts();
            SettingsHandler.loadImportedContacts();

        } catch (e) {

            console.log('[loadDataFromServer] Error :: ' + e);
        }
    }

    const registerEmitters = () => {

        try {

            console.log('[registerEmitters] -------------');

            evntEmitter.on(EmitterConstants.EMMIT_ON_SMS_GROUPS_RECEIVED, reloadSMSGroups);
            evntEmitter.on(EmitterConstants.EMMIT_ON_SMS_SETTINGS_RECEIVED, updateSMSView);

        } catch (e) {

            console.log('[registerEmitters] Error :: ' + e);
        }
    }

    const handleMainTabSelect = (value) => {

        try {

            if (value === selectMainTab) {
                return;
            }

            setMainTabActive(value);

        } catch (e) {

            console.log('[handleMainTabSelect] Error :: ' + e);
        }

    };

    const handleTabSelect = (value) => {

        try {

            if (value === selectedTab) {
                return;
            }

            setLoadingNew(false);
            setSelectedGroup(false);

            console.log('[handleTabSelect] ---- tab :: ' + value);

            var buddy_data = [];

            setSelectedTab(value);

            if (onSelectIndividualSMS) {

                onSelectIndividualSMS();
            }

            if (value == 'all') {

                //buddy_data = allSMSList;
                selectedTabIndex = Constants.REQ_SMS_TAB_TYPE.ALL_SMS;

                //Send server request to load data and assign the response to the corresponding state variable

            } else if (value == 'indi') {

                //buddy_data = smsIndividualList;
                selectedTabIndex = Constants.REQ_SMS_TAB_TYPE.INDIVIDUAL_SMS;

                //Send server request to load data and assign the response to the corresponding state variable

            } else if (value == 'group') {

                //buddy_data = allSMSList;
                selectedTabIndex = Constants.REQ_SMS_TAB_TYPE.SMS_GROUPS;

                //Send server request to load data and assign the response to the corresponding state variable

            } else if (value == 'unread') {

                //Send server request to load data and assign the response to the corresponding state variable
                selectedTabIndex = Constants.REQ_SMS_TAB_TYPE.SMS_UNREAD;
            }

            var buddy_data = MessageHandler.getSMSData(selectedTabIndex);

            if (buddy_data.length == 0) {

                setLoadingNew(true);

                console.log("[handleTabSelect] ---------- Send server request to load data. Tab Index :: " + selectedTabIndex);

                SettingsHandler.loadSMSData("", selectedTabIndex);
            }

            setFinalData(buddy_data);

        } catch (e) {

            console.log('[handleTabSelect] Error :: ' + e);
        }

    };

    const updateSMSView = () => {

        try {

            let sms_enable_status = localStorage.getItem(Constants.WS_KEY_SMS_ENABLED_STATUS);
            setSMSEnableStatus(sms_enable_status);

        } catch (e) {

            console.log('[updateSMSView] Error :: ' + e);
        }
    }

    const reloadSMSGroups = (data) => {

        try {

            console.log("[reloadSMSGroups] ========= data :: " + JSON.stringify(data));

            if (data.noData) {//If there is not data in Server DB as well we will get empty response.

                setLoading(false);
                loadMoreStatus = false;

                return;
            }

            if (data) {

                setIndividualUnreadCount(data.INDIVIDUAL_UNREAD_COUNT);
                setallUnreadCount(data.ALL_UNREAD_COUNT);
            }

            var groups = MessageHandler.getSMSData(selectedTabIndex);

            console.log("[reloadSMSGroups] groups --- " + groups.length);

            setLoadingNew(false);

            //setAllSMSList(groups);
            setFinalData([]);
            setFinalData([...groups]);

            setLoading(false);
            loadMoreStatus = false;


        } catch (e) {

            console.log('[reloadSMSGroups] Error :: ' + e);
        }
    }

    const onClickSMSItem = (member) => {

        try {

            console.log("[onClickSMSItem] --- member :: " + JSON.stringify(member));

            let phnumber = member.phnumber;
            let group_code;

            if (selectedTabIndex === Constants.REQ_SMS_TAB_TYPE.SMS_GROUPS) {

                group_code = member.code;

            } else if (member.message && JSON.parse(member.message).group_code) {

                onSelectIndividualSMS();

                group_code = JSON.parse(member.message).group_code * 1;

            }

            if (group_code) {//Selected Group SMS in Recents

                setSelectedGroup(group_code);
                //onClickGroup();

                console.log(TAG + "[onClickSMSItem] isMobile  :: " + isMobile + " ---------- group_code :: " + group_code);
                if (isMobile || isIOS || isAndroid) {

                    navigate('/didcomponent');
                } else {

                    onClickGroup();
                }

                SettingsHandler.loadSMSMGroupDIDs(group_code, phnumber, '');

            } else {//Selected Specific DID from a Group in Recents

                console.log(TAG + "[onClickSMSItem] isMobile :: " + isMobile + " : Phnumber :: " + member.phnumber)

                if (isMobile || isIOS || isAndroid) {

                    navigate('/chat', { state: { member } });
                } else {

                    onClickSMSDID(member);
                    setSelectedGroup(member.phnumber);
                }

                SettingsHandler.loadSMSMessages('', member.phnumber, Constants.SMS_CHAT_TYPES.WS_ONE_TO_ONE_SMS, {});
            }

        } catch (e) {

            console.log(TAG + '[onClickSMSItem] Error :: ' + e);
        }
    }

    const loadMoreData = () => {

        try {

            if (loading) return; // Prevent multiple simultaneous loads

            setLoading(true);//This is to show the loading indicator for load more data

            if (loadMoreStatus == true) {
                return;
            }

            loadMoreStatus = true;

            SettingsHandler.loadSMSData(searchString, selectedTabIndex);

        } catch (e) {

            console.log('[loadMoreMessages] Error :: ' + e);
        }

    }

    const handleScroll = (e) => {

        try {

            if (loadMoreStatus == true) {

                return;
            }

            const container = containerRef.current;
            if (container) {

                const scrollTop = container.scrollTop; // scrolled content from the top
                const scrollHeight = container.scrollHeight; // Total height of the scrollable content
                const clientHeight = container.clientHeight; // Height of the visible part of the container

                if (scrollTop + clientHeight >= scrollHeight - 10 && !loading) {
                    // Added a small buffer of 5px to account for rounding issues

                    loadMoreData();
                }
            }

        } catch (e) {
            console.log("[handleScroll] Error :: " + e);
        }
    };

    const debounce = (func, wait) => {

        let timeout;
        return function (...args) {

            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const debouncedHandleScroll = debounce(handleScroll, 600)

    const onSearchKeyDown = (event) => {

        try {

            if (event.key === "Enter") {

                console.log("Enter key was pressed!");

                //send server request
                SettingsHandler.loadSMSData(searchString, selectedTabIndex);
            }

        } catch (e) {

            console.log('[onSearchKeyDown] Error :: ' + e);
        }
    }

    const startSearch = (event) => {

        try {

            let searchKeyWord = event.target.value;
            console.log("[startSearch] : " + searchKeyWord + " :: final_data length :: " + final_data.length + " :: tempAllSMSList length :: " + tempAllSMSList.length);

            setSearchString(searchKeyWord);

            if (searchKeyWord !== '') {//Search is started.

                let data;

                data = tempAllSMSList;
                if (tempAllSMSList.length === 0) {

                    console.log('------- final_data ::' + final_data);

                    data = final_data;
                    setTempAllSMSList(final_data);
                }

                console.log('temp list -- ' + JSON.stringify(tempAllSMSList));

                var search_data = data.filter((data) => {

                    let found_message;

                    console.log('data :: ' + JSON.stringify(data) + " :: mesage :: " + data.message);

                    // This works fro All and Individual SMS tabs. It don't have title attribute.
                    if (data.phnumber) {

                        found_message = String(data.phnumber).includes(searchKeyWord);

                        if (!found_message) {

                            if (data.message && JSON.parse(data.message).group_title) {

                                found_message = JSON.parse(data.message).group_title.toLowerCase().includes(searchKeyWord.toLowerCase())

                            }
                        }

                    } else if (data.title) {// This works for Groups tab. This tab doesn't have phnumber attribute.

                        found_message = data.title.toLowerCase().includes(searchKeyWord.toLowerCase());
                    } else {

                        found_message = false;
                    }


                    return found_message;
                });

                setFinalData(search_data);

                console.log("search data :: " + search_data.length + " :: FinalData :: " + final_data.length)

            } else {//Search stopped.

                console.log('Search completed ----');

                setFinalData(tempAllSMSList);
                setTempAllSMSList([]);
            }

        } catch (e) {

            console.log('[startSearch] Error :: ' + e);
        }
    }

    /// For SMS popup - Starts
    const showPopUpToEnterFromToNumbers = (group_details) => {
        try {

            let didParams = {};
            let fromDIDList;  // Get User DID list

            if (group_details.code) {

                let group_did_details = MessageHandler.getSMSAssignedGroupsDIDList(group_details.code);
                fromDIDList = group_did_details.did_list.split(',');

            } else {

                fromDIDList = StreamsHandler.loadFromUserDIDs();
            }


            didParams.did_list = fromDIDList;//[11015565966, 11015565966];

            // Check if the DID is saved in localStorage
            let strPersistDID = localStorage.getItem(Constants.WS_KEY_SMS_ALWAYS_USE_DID);
            console.log("[showPopUpToEnterFromToNumbers] - strPersistDID: " + JSON.stringify(strPersistDID) + " :: group_details :: " + JSON.stringify(group_details) + " :: fromDIDList :: " + fromDIDList);

            didParams.isEnableAlwaysUseDID = Boolean(strPersistDID && strPersistDID.length > 0);
            //didParams.to = '';  // Example: To number
            didParams.from = strPersistDID ? strPersistDID : fromDIDList[0];  // Example: From number
            didParams.group_title = group_details.title;
            didParams.group_code = group_details.code;
            didParams.group_details = group_details;

            setSMSPopupInputs(didParams)

            console.log('[showPopUpToEnterFromToNumbers] - didParams:', JSON.stringify(didParams))
            setPopUpVisible(true);  // Set modal visibility to true to show popup

        } catch (error) {
            console.error('Error in showPopUpToEnterFromToNumbers:', error);
        }
    };

    function onPopUpCallBack(sms_selected_details) {
        try {

            console.log('[onPopUpCallBack] sms_selected_details: ' + JSON.stringify(sms_selected_details))

            SettingsHandler.saveSMSAlwaysUseDetails(sms_selected_details)
            sms_selected_details.isNavigatedSMSPopUp = true

            let group_data = sms_selected_details.group_details;

            group_data.from = sms_selected_details.from;
            group_data.to = sms_selected_details.to;

            //onClickSMSDID(sms_selected_details);

            //As user has given From and To numbers in PopUp, send the message directly to the TO user.
            let final_message = StreamsHandler.prepareSMSData(sms_selected_details.message, group_data, IMConstants.WS_IM_SMS);
            StreamsHandler.onOutgoingMessage('', sms_selected_details.to, final_message, IMConstants.WS_IM_SMS, 2);

            evntEmitter.emit(EmitterConstants.EMMIT_ON_SMS_GROUP_DIDS_RECEIVED, { "group_code": (sms_selected_details.group_code * 1) });

        } catch (e) {
            console.log("[SMSPopup].onPopUpCallBack() Error: " + e);
        }
    }

    return (
        <>
            <div className='shadow-mob-0 shadow-3'>

                <MDBTabs justify className='ms-2'>
                    <MDBTabsItem>
                        <MDBTabsLink onClick={() => handleMainTabSelect('recents')} active={selectMainTab === 'recents'} className='d-flex align-items-center flex-column'>
                            <i class="fas fa-clock fa-2x"></i>
                            <p className="pt-2 tabsText d-block">
                                Recents
                            </p>
                        </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                        <MDBTabsLink onClick={() => handleMainTabSelect('sms')} active={selectMainTab === 'sms'} className='d-flex align-items-center flex-column'>
                            <i class="fas fa-comments fa-2x"></i>
                            <p className="pt-2 tabsText d-block">
                                SMS
                            </p>
                        </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                        <MDBTabsLink onClick={() => handleMainTabSelect('Contacts')} active={selectMainTab === 'Contacts'} className='d-flex align-items-center flex-column'>
                            <i class="far fa-address-book fa-2x"></i>
                            <p className='pt-2 d-block tabsText'>
                                Contacts
                            </p>
                        </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                        <MDBTabsLink onClick={() => handleMainTabSelect('dialpad')} active={selectMainTab === 'dialpad'} className='d-flex align-items-center flex-column'>
                            <img src={dialpad} width={25} />
                            <p className='pt-2 d-block tabsText'>
                                Dialpad
                            </p>
                        </MDBTabsLink>
                    </MDBTabsItem>
                    {isMobile &&
                        <MDBTabsItem>
                            <MDBTabsLink onClick={() => handleMainTabSelect('more')} active={selectMainTab === 'more'} className='d-flex align-items-center flex-column'>
                                <i class="fas fa-ellipsis fa-2x"></i>
                                <p className='pt-2 d-block tabsText'>
                                    More
                                </p>
                            </MDBTabsLink>
                        </MDBTabsItem>
                    }
                </MDBTabs>



                <MDBTabsContent>
                    <MDBTabsPane open={selectMainTab === 'sms'}>
                        <div className="users-view-container pt-0" ref={containerRef}>

                            {/* <div className="px-3 pb-3 d-flex align-items-center justify-content-between" >
                                <h5 className='m-0'>SMS</h5>
                                <div className="d-flex">
                                    <div className="me-3">
                                        <i class="far fa-comment fa-lg"></i>
                                    </div>
                                    <div className="">
                                        <i class="fas fa-pencil fa-lg"></i>
                                    </div>
                                </div>
                            </div> */}


                            <div className="position-relative userSearch d-flex align-items-center justify-content-between mt-2 pe-2">
                                <input placeholder='Search' onChange={(e) => { startSearch(e) }} onKeyDown={onSearchKeyDown} />
                                <img src={Iconsearch} alt="" className='inputIcon' />

                            </div>
                            <div className="d-flex pt-2">
                                <MDBChip className={`${selectedTab == 'all' ? "active" : ""}`} onClick={() => handleTabSelect('all')} active={selectedTab === 'all'} >All  {allUnreadCount > 0 && <span>({allUnreadCount + individualUnreadCount})</span>}</MDBChip>
                                <MDBChip className={`${selectedTab == 'indi' ? "active" : ""}`} onClick={() => handleTabSelect('indi')} active={selectedTab === 'indi'}>Individual {individualUnreadCount > 0 && <span>({individualUnreadCount})</span>}</MDBChip>
                                <MDBChip className={`${selectedTab == 'group' ? "active" : ""}`} onClick={() => handleTabSelect('group')} active={selectedTab === 'group'}>Group</MDBChip>
                                <MDBChip className={`${selectedTab == 'unread' ? "active" : ""}`} onClick={() => handleTabSelect('unread')} active={selectedTab === 'unread'}>Unread</MDBChip>
                            </div>
                            <MDBTabsContent>

                                {/* <MDBTabsPane open={selectedTab === 'tab1'}> */}
                                <MDBTabsPane open={(selectedTab === 'all') || (selectedTab === 'indi') || (selectedTab === 'group') || (selectedTab === 'unread')}>
                                    {loadingNew ? (
                                        // Skeleton Loader
                                        Array(9).fill().map((_, index) => (
                                            <SkeletonTheme>
                                                <div className="d-flex align-items-center p-2 cursor-pointer">
                                                    <Skeleton width={40} height={40} borderRadius={"8px"} />
                                                    <div className="W-85 d-flex flex-column ps-3 pe-2 ps-2">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <Skeleton width="190px" />
                                                            <Skeleton width="60px" />
                                                        </div>
                                                        <p>
                                                        </p>
                                                    </div>
                                                </div>
                                            </SkeletonTheme>

                                        ))
                                    ) :
                                        (
                                            (final_data.length === 0) ? (

                                                <div className='d-flex justify-content-center align-items-center h-100'>
                                                    <p>No Data to display.</p>
                                                </div>

                                            )
                                                :
                                                (final_data.map((member, index) => {

                                                    //console.log('[final_data] member ---- index : ' + index + ' :: ' + JSON.stringify(member));

                                                    let selectedItem;
                                                    let msg;

                                                    let message_data = member.message ? JSON.parse(member.message) : member;

                                                    msg = (member.msgtype * 1) === 51 ? "MMS Received" : message_data.msg

                                                    console.log("[final_data] member --2222-- index : " + index + " :: selectedTabIndex :: " + selectedTabIndex + " :: msg :: " + msg + " :: message_data :: " + JSON.stringify(message_data) + " :: member :: " + JSON.stringify(member));

                                                    if (member.code) {

                                                        selectedItem = member.code
                                                    } else if (member.phnumber) {

                                                        selectedItem = member.phnumber;
                                                    }

                                                    return (
                                                        <div key={index} className={`d-flex align-items-center p-2  mt-3 cursor-pointer didBuddy ${(selectedGroup == selectedItem) ? 'activeItem' : ''}`}
                                                            onClick={() => { onClickSMSItem(member) }}>

                                                            <img
                                                                src={`${member.code || (message_data.group_code) ? Group : Profile}`}
                                                                alt={member.title}
                                                                className='profileImageUser'
                                                            />
                                                            <div className="W-85 d-flex flex-column ps-3 pe-2 ps-2">
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <p className='ChatUserName'>
                                                                        {(() => {

                                                                            return selectedTabIndex === Constants.REQ_SMS_TAB_TYPE.SMS_GROUPS
                                                                                ? member.title
                                                                                :
                                                                                (message_data && message_data.group_code)
                                                                                    ? `${message_data.to} [${message_data.group_title}]`
                                                                                    : member.phnumber;
                                                                        })()}
                                                                    </p>
                                                                    <div className='d-flex flex-row align-items-center'>

                                                                        <p className={`text-secondary ${member.code ? "dateText" : "dateTextNew"}`}>
                                                                            {
                                                                                (() => {

                                                                                    let message_time = selectedTabIndex == Constants.REQ_SMS_TAB_TYPE.SMS_GROUPS
                                                                                        ? member.createdon
                                                                                        : member.latest_time;

                                                                                    return Utils.getFormatedDate(message_time, Constants.DATE_FORMATS.WS_GROUP_DID_DATE)
                                                                                })()
                                                                            }
                                                                        </p>

                                                                        {member.code &&
                                                                            <div className="px-2 plusIcon" title='Send New SMS' onClick={(event) => { showPopUpToEnterFromToNumbers(member, event) }}>
                                                                                <MDBIcon fas icon="plus fa-lg" />
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                </div>

                                                                <div className='d-flex flex-row align-items-center justify-content-between'>
                                                                    <p className='ellipsis'>
                                                                        {selectedTabIndex == Constants.REQ_SMS_TAB_TYPE.INDIVIDUAL_SMS || selectedTabIndex == Constants.REQ_SMS_TAB_TYPE.ALL_SMS ? msg : ""}
                                                                    </p>
                                                                    {member.unread_count > 0 && (

                                                                        <MDBBadge color='success' pill>
                                                                            {member.unread_count}
                                                                        </MDBBadge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                                )
                                        )}
                                </MDBTabsPane>

                            </MDBTabsContent>

                            {/* SMS popup starts */}
                            <div>
                                {isPopUpVisible && (
                                    ChatComponents.showSMSPopUp(
                                        MessaageConstants.SMS_ALERT_GROUP_SMS_TO_FROM_NUMBER_SELECTION + " (" + smsPopupInputs.group_title + ")",  // Title for the modal
                                        smsPopupInputs,  // User details to the popup
                                        setSMSPopupInputs,
                                        isPopUpVisible,  // Modal visibility state
                                        setPopUpVisible,  // Function to change modal visibility
                                        onPopUpCallBack  // Callback or data handler
                                    )
                                )}
                            </div>
                            {/* SMS popup Ends */}

                        </div>
                    </MDBTabsPane>
                    <MDBTabsPane open={selectMainTab === 'Contacts'}>
                        <Contacts />
                    </MDBTabsPane>

                    <MDBTabsPane open={selectMainTab === 'dialpad'}>
                        <DialPad dailpadNumberClick={dailpadNumberClick} />
                    </MDBTabsPane>

                    <MDBTabsPane open={selectMainTab === 'recents'}>
                        <Recents onClickRecents={onClickRecents} />
                    </MDBTabsPane>

                </MDBTabsContent>
            </div>
        </>
    )
}

export default UsersComponent
