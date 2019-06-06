import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import { Tabs } from 'antd';
import { ContainerBody } from "src/components/LittleComponents";
import { actions } from 'src/redux/modules/installManager';
import HostList from './HostList';
import TaskList from './TaskList';
import RecordList from './RecordList';

const TabPane = Tabs.TabPane;

class InstallManage extends Component {

    panes = [
        {
            key: 'tab1',
            title: '装机列表',
            content: <HostList/>,
        }, {
            key: 'tab2',
            title: '装机任务',
            content: <TaskList/>,
        }, {
            key: 'tab3',
            title: '装机结果',
            content: <RecordList/>,
        },
    ];
    onTabsChange = (e) => {
        this.props.changeActiveTab(e);
    };

    render() {
        return (
            <ContainerBody>
                <Tabs
                    activeKey={ this.props.activeTab }
                    className="sd-tabs"
                    onChange={ this.onTabsChange }
                    onEdit={ this.onEdit }
                >
                    {
                        this.panes.map((pane) =>
                            <TabPane key={ pane.key } tab={ pane.title }>
                                { pane.content }
                            </TabPane>)
                    }
                </Tabs>
            </ContainerBody>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        activeTab: state.installManager.activeTab,
    }
};

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InstallManage);