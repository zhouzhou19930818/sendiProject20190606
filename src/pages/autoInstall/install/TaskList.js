// 装机任务
import React, { Component, Fragment } from 'react';
import { Button, Input, message, Modal } from 'antd';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import { prefixRoute } from "src/configs";
import SDTable from 'src/components/SDTable';
import { GenerateFields, Label } from 'src/components/LittleComponents';
import api from "src/tools/api";
import { debounce } from "src/tools/utils";

// 0未装机，1已装机，2正在装机，3装机异常
// const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复（已装机）'];

class InstallTaskRouter extends Component {
    state = {
        selectedRowKeys: [], // Check here to configure the default column
        tableLoading: true,
        dataSource: [],
        scrollY: undefined,
        currentObj: {
            obj: {},
            fields: {},
        },
        installResult: [],
        modalVisible: false,
        detailDataSource: {
            success: [],
            failed: [],
        }
    };
    columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
        },
        {
            title: '任务名称',
            dataIndex: 'installTaskName',
            key: 'installTaskName',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '成功',
            dataIndex: 'successNum',
            key: 'successNum',
        },
        {
            title: '失败',
            dataIndex: 'faildNum',
            key: 'faildNum',
        },
        {
            title: '操作',
            key: 'op',
            render: (d) => {
                return (<Button htmlType="button"
                                style={ { height: '22px' } }
                                onClick={ this.getDetailFields(d) }
                >查看</Button>)
            }
        },
    ];

    detailColumns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
        }, {
            title: '序列号',
            dataIndex: 'hostSn',
            key: 'hostSn',
        }, {
            title: '机房',
            dataIndex: 'roomName',
            key: 'roomName',
        }, {
            title: '是否server服务器',
            dataIndex: 'isCobblerHost',
            key: 'isCobblerHost',
            render: (text) => <div style={ { textAlign: 'center' } }>{ text ? '是' : '否' }</div>,
        },
    ];

    componentDidMount() {
        this.getList();
        this.setScrollY();
    }

    // 获取列表数据
    getList = () => {
        if (!this.state.tableLoading) this.setState({ tableLoading: true });
        api.getAllInstalTask().then(res => {
            if (res.data.success !== 'true') {
                this.setState({ tableLoading: false });
                message.error(res.data.msg);
                return;
            }
            this.setState({
                tableLoading: false,
                dataSource: res.data.data && res.data.data.map((d, i) => ({ ...d, index: i + 1 })),
            });
        }).catch(() => {
            this.setState({ tableLoading: false });
        });
    };

    // 获取某个数据的详情
    getDetailFields = (obj) => () => {
        this.setState({
            modalVisible: true,
            currentObj: {
                obj: obj,
                fields: {
                    installTaskName: ['任务名称', obj.installTaskName],
                    createTime: ['创建时间', moment(obj.createTime).format('YYYY-MM-DD HH:mm:ss')],
                    description: ['描述', obj.description],
                },
            }
        });
        api.getInstallRecordByTaskId(obj.automaticInstallTaskId).then(res => {
            if (res.data.success !== 'true') {
                Modal.error({ title: '查看详情失败', content: res.data.msg });
                return;
            }
            let success = [], failed = [];
            res.data.data.forEach((d, i) => {
                if (d.status === 1) {
                    success.push({ ...d, index: i + 1 });
                } else if (d.status === 3) {
                    success.push({ ...d, index: i + 1 });
                }
            });
            this.setState({
                detailDataSource: {
                    success: success,
                    failed: failed,
                },
            });
        });
    };

    setScrollY = () => {
        const contentEl = document.getElementsByClassName('router-wrapper')[0];
        let scrollY = undefined;
        if (contentEl) {
            const contentPadding = 16;
            const contentTabs = 61;
            const contentFilterForm = 37;
            const contentTablePagination = 44;
            const contentTableHead = 64; // 当表格内容占两行时的高度, 43: 一行的高度
            const containerHeight = contentEl.clientHeight;
            scrollY = containerHeight - contentPadding - contentTabs - contentFilterForm - contentTablePagination - contentTableHead;
        }
        this.setState({ scrollY });
    };

    onSearchChange = (e) => {
        this.setState({ tableLoading: true });
        const fn = (value) => () => {
            api.getInstallTaskByNameOrDesc(value).then(res => {
                this.setState({
                    tableLoading: false,
                    dataSource: res.data.data && res.data.data.map((d, i) => ({ ...d, index: i + 1 })),
                });
            })
        };
        debounce(fn(e.target.value));
    };

    onRowSelect = (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
    };

    render() {
        const state = this.state;
        return (
            <Fragment>
                <div className="sd-filter-form">
                    <Button htmlType="button"
                            type="primary"
                            className="sd-minor"
                            style={ { margin: '0 8px 0 0' } }
                            onClick={ () => this.props.history.push(prefixRoute + '/install_task_create') }
                    >
                        创建
                    </Button>
                    <Input.Search
                        onChange={ this.onSearchChange }
                        placeholder="请输入名称或描述"
                        style={ { width: '230px', float: 'right' } }/>
                </div>
                <SDTable
                    rowKey="automaticInstallTaskId"
                    loading={ state.tableLoading }
                    columns={ this.columns }
                    dataSource={ state.dataSource }
                    rowSelection={ {
                        selectedRowKeys: state.selectedRowKeys,
                        onChange: this.onRowSelect,
                    } }
                    scroll={ { y: state.scrollY } }
                    columnsProportion={ [1, 2, 2, 3, 1, 1, 1] }
                />
                <Modal title="查看任务"
                       width="80%"
                       visible={ state.modalVisible }
                       onCancel={ () => this.setState({ modalVisible: false }) }
                       footer={ null }
                       centered={ true }
                >
                    <GenerateFields fields={ state.currentObj.fields } colCount={ 3 }/>
                    <div>
                        <Label field={ ['成功数目', state.currentObj.obj.successNum] } wrapper={ { span: 8 } }/>
                        <SDTable rowKey="automaticInstallRecordId"
                                 columns={ this.detailColumns }
                                 dataSource={ state.detailDataSource.success }
                                 scroll={ { y: '140px' } }
                                 pagination={ false }
                        />
                    </div>
                    <div>
                        <Label field={ ['失败数目', state.currentObj.obj.faildNum] } wrapper={ { span: 8 } }/>
                        <SDTable rowKey="automaticInstallRecordId"
                                 columns={ this.detailColumns }
                                 dataSource={ state.detailDataSource.failed }
                                 scroll={ { y: '140px' } }
                                 pagination={ false }
                        />
                    </div>
                </Modal>
            </Fragment>
        )
    }
}

export default withRouter(InstallTaskRouter);