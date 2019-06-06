// 装机历史
import React, { Component, Fragment } from 'react';
import { Button, Input, Radio, message } from 'antd';
import api from "src/tools/api";
import SDTable from 'src/components/SDTable';
import { debounce, computeHeight, downloadFile } from "src/tools/utils";
import moment from "moment";

const { Button: RadioButton, Group: RadioGroup } = Radio;

// 0未装机，1已装机，2正在装机，3装机异常
const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复（已装机）'];

export default class RecordList extends Component {

    state = {
        selectedRowKeys: [], // Check here to configure the default column
        tableLoading: true,
        dataSource: [],
        scrollY: undefined,
    };
    columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
        },
        {
            title: '序列号',
            dataIndex: 'hostSn',
            key: 'hostSn',
        },
        {
            title: '机房',
            dataIndex: 'roomId',
            key: 'roomId',
        },
        {
            title: '任务名称',
            dataIndex: 'installTaskName',
            key: 'installTaskName',
        },
        {
            title: '是否server服务器',
            dataIndex: 'isCobblerHost',
            key: 'isCobblerHost',
            render: (text) => <div style={ { textAlign: 'center' } }>{ text ? '是' : '否' }</div>,
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
        },
        {
            title: '装机结果',
            dataIndex: 'status',
            key: 'status',
            render: (status) => allStatus[status],
        },
    ];
    hostSn = '';
    status = '';

    componentDidMount() {
        this.getList();
        this.setScrollY();

        window.addEventListener("resize", () => {
            this.setScrollY();
        });
    }

    getList = () => {
        if (!this.state.tableLoading) this.setState({ tableLoading: true });
        api.getAllInstallRecord().then(res => {
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

    setScrollY = () => {
        let scrollY = undefined;
        const compute = computeHeight([[568, 606, 805], [105, 120, 100, 64]]);
        if (compute) {
            const containerHeight = compute.height;
            const contentTableHead = compute.candidateHeight;
            const contentPadding = 16;
            const contentTabs = 61;
            const contentFilterForm = 38;
            const contentTablePagination = 44;
            scrollY = containerHeight - contentPadding - contentTabs - contentFilterForm - contentTablePagination - contentTableHead;
        }
        this.setState({ scrollY });
    };

    // 装机状态查询
    onFilter = (attr, value) => (e) => {
        this.setState({ tableLoading: true });
        if (value === undefined) {
            value = e.target ? e.target.value : e;
        }
        api.getInstallRecordFuzzily({
            hostSn: attr === 'hostSn' ? value : this.hostSn,
            status: attr === 'status' ? value : this.status,
        }).then(res => {
            this.setState({
                tableLoading: false,
                dataSource: res.data.data && res.data.data.map((d, i) => ({ ...d, index: i + 1 })),
            });
        })
    };

    onRowSelect = (selectedRowKeys) => this.setState({ selectedRowKeys });

    onRowSelectAll = (selected) => this.setState({ selectedRowKeys: selected ? this.state.dataSource.map(d => d.automaticInstallRecordId) : [] });

    // 导出导出
    exportExcel = () => {
        api.exportInstallRecord(this.state.selectedRowKeys.join(',')).then(res => {
            downloadFile(res);
            this.setState({ selectedRowKeys: [] });
        })
    };

    render() {
        return (
            <Fragment>
                <div className="sd-filter-form">
                    <Button htmlType="button"
                            type="primary"
                            className="sd-minor"
                            style={ { margin: '0 8px 0 0' } }
                            onClick={ this.exportExcel }
                    >
                        导出
                    </Button>
                    <RadioGroup defaultValue="" onChange={ this.onFilter('status') }>
                        <RadioButton value="">全部</RadioButton>
                        <RadioButton value={ 1 }>成功</RadioButton>
                        <RadioButton value={ 3 }>失败</RadioButton>
                    </RadioGroup>
                    <Input.Search
                        onChange={ (e) => debounce(this.onFilter('hostSn', e.target.value)) }
                        placeholder="请输入序列号、机房、任务名称"
                        style={ { width: '230px', float: 'right' } }/>
                </div>
                <SDTable
                    rowKey="automaticInstallRecordId"
                    loading={ this.state.tableLoading }
                    columns={ this.columns }
                    dataSource={ this.state.dataSource }
                    rowSelection={ {
                        selectedRowKeys: this.state.selectedRowKeys,
                        onChange: this.onRowSelect,
                        onSelectAll: this.onRowSelectAll,
                    } }
                    scroll={ { y: this.state.scrollY } }
                    columnsProportion={ [1, 2, 1, 2, 2, 2, 1, 1,] }
                />
            </Fragment>
        )
    }
}