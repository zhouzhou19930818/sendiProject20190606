// 装机列表
import React, { Component, Fragment } from 'react';
import { Button, Radio, Input, Row, Col, message, Upload } from 'antd';
import update from 'immutability-helper';
import { withRouter } from 'react-router-dom';
import api from 'src/tools/api';
import { computeHeight, debounce, downloadFile } from 'src/tools/utils';
import SDTable from 'src/components/SDTable';
import { prefixRoute } from "src/configs";

const { Button: RadioButton, Group: RadioGroup } = Radio;
// 成功: 1, 失败: 3
const allStatus = [
    {
        title: '未装机',
        btnText: '装机',
    },
    {
        title: '已装机',
        btnText: '重装',
    },
    {
        title: '正在装机',
        btnText: null,
    },
    {
        title: '装机异常',
        btnText: '装机',
    },
    {
        title: '人工修复（已装机）',
        btnText: '重装',
    },
];

class HostList extends Component {

    state = {
        selectedRowKeys: [], // Check here to configure the default column
        dataSource: [],
        scrollY: undefined,
        tableLoading: true,
        uploading: false,
    };
    columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
        },
        {
            title: '序列号',
            dataIndex: 'sn',
            key: 'sn',
        },
        {
            title: '机房',
            dataIndex: 'roomName',
            key: 'roomName',
        },
        {
            title: '是否server服务器',
            dataIndex: 'isCobblerHost',
            key: 'isCobblerHost',
            render: (data, obj, index) => {
                return (
                    <RadioGroup onChange={ this.onCobblerChange(obj, index) } value={ data }>
                        <Radio value={ true }>是</Radio>
                        <Radio value={ false }>否</Radio>
                    </RadioGroup>
                )
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => allStatus[status] ? allStatus[status].title : '',
        },
        {
            title: '操作',
            key: 'op',
            render: (obj) => {
                return allStatus[obj.status] && allStatus[obj.status].btnText ?
                    <Button htmlType="button"
                            style={ { height: '26px' } }
                            onClick={ () => this.goToCreateTask(obj) }
                    >{ allStatus[obj.status].btnText }</Button> : ''
            }
        },
    ];

    sn = '';

    status = '';

    uploadProps = {
        accept: '.xls,.xlsx',
        showUploadList: false,
        beforeUpload: (file) => {
            this.setState({ uploading: true });
            const formData = new FormData();
            formData.append('file', file);

            api.importHostExcel(formData).then(res => {
                if (res.data.success !== 'true') {
                    this.setState({ uploading: false });
                    message.error(res.data.msg);
                    return;
                }
                this.setState({ uploading: false });
                message.success('导入成功');
                this.getList();
            }).catch(() => this.setState({ uploading: false }));
            return false;
        },
    };

    componentDidMount() {
        this.getList();
        this.setScrollY();

        window.addEventListener("resize", () => {
            this.setScrollY();
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => this.setScrollY());
    }

    getList = () => {
        if (!this.state.tableLoading) this.setState({ tableLoading: true });
        this.setState({ tableLoading: true });
        api.getAllHost().then(res => {
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
        const compute = computeHeight([[568, 606, 805], [105, 120, 100, 64]]);
        let scrollY = undefined;
        if (compute) {
            const contentPadding = 16;
            const contentTabs = 61;
            const contentTablePagination = 44;
            // const contentTableHead = 64; // 当表格内容占两行时的高度, 43: 一行的高度
            const containerHeight = compute.height;
            const contentTableHead = compute.candidateHeight;
            const filterFormEL = document.getElementById('filterForm');
            let contentFilterForm = 45;
            if (filterFormEL) contentFilterForm = filterFormEL.clientHeight + 5;
            scrollY = containerHeight - contentPadding - contentTabs - contentFilterForm - contentTablePagination - contentTableHead;
        }
        this.setState({ scrollY });
    };

    // 切换是否server服务器
    onCobblerChange = (obj, index) => (e) => {
        this.setState({ tableLoading: true });
        api.updateHost({
            automaticHostId: obj.automaticHostId,
            isCobblerHost: e.target.value,
        }).then(res => {
            if (res.data.success !== 'true') {
                message.error(res.data.msg);
                this.setState({ tableLoading: false });
                return;
            }
            this.setState(update(this.state, {
                tableLoading: { $set: false },
                dataSource: {
                    [index]: {
                        isCobblerHost: { $set: e.target.value },
                    }
                }
            }));
        })
    };

    onRowSelect = (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
    };

    onFilter = (attr, value) => (e) => {
        this.setState({ tableLoading: true });
        if (value === undefined) {
            value = e.target ? e.target.value : e;
        }
        api.getHostFuzzily({
            sn: attr === 'sn' ? value : this.sn,
            status: attr === 'status' ? value : this.status,
        }).then((res) => {
            this.setState({
                dataSource: res.data.data && res.data.data.map((d, i) => ({ ...d, index: i + 1 })),
                tableLoading: false,
            });
        }).catch(() => {
            this.setState({
                tableLoading: false,
            });
        })
    };

    colProps = (sm, md, lg, xl) => ({
        sm: { span: sm }, md: { span: md }, lg: { span: lg }, xl: { span: xl }
    });

    goToCreateTask = (obj) => {
        let ids = '';
        if (obj && obj.automaticHostId) {
            ids = obj.automaticHostId.toString();
        } else {
            if (this.state.selectedRowKeys.length < 1) {
                message.destroy();
                message.error('请选择至少一个主机');
                return;
            }
            ids = this.state.selectedRowKeys.join(',');
        }
        this.props.history.push(prefixRoute + '/install_task_create', ids);
    };

    render() {
        return (
            <Fragment>
                <Row className="sd-filter-form" id="filterForm">
                    <Col { ...this.colProps(5, 5, 3, 3) }>
                        <Upload { ...this.uploadProps }>
                            <Button htmlType="button"
                                    type="primary"
                                    className="sd-minor"
                                    loading={ this.state.uploading }
                            >导入资源</Button>
                        </Upload>
                    </Col>
                    <Col { ...this.colProps(5, 5, 3, 3) }>
                        <Button htmlType="button"
                                type="primary"
                                className="sd-wireframe"
                                onClick={ () => api.downHostExcel().then(res => downloadFile(res)) }
                        >下载模板</Button>
                    </Col>
                    <Col { ...this.colProps(8, 6, 5, 4) }>
                        <Button htmlType="button"
                                type="primary"
                                className="sd-wireframe"
                                style={ { marginRight: '5px' } }
                                onClick={ this.goToCreateTask }
                        >装机</Button>
                        <Button htmlType="button"
                                type="primary"
                                className="sd-wireframe"
                                onClick={ this.goToCreateTask }
                        >重装</Button>
                    </Col>
                    <Col { ...this.colProps(12, 12, 7, 5) }>
                        <RadioGroup defaultValue="" onChange={ this.onFilter('status') }>
                            <RadioButton value="">全部</RadioButton>
                            <RadioButton value={ 1 }>已装机</RadioButton>
                            <RadioButton value={ 3 }>未装机</RadioButton>
                        </RadioGroup>
                    </Col>
                    <Col>
                        <Input.Search
                            onChange={ (e) => debounce(this.onFilter('sn', e.target.value)) }
                            placeholder="请输入序列号"
                            style={ { width: '230px', float: 'right' } }/>
                    </Col>
                </Row>
                <SDTable
                    rowKey="automaticHostId"
                    loading={ this.state.tableLoading }
                    columns={ this.columns }
                    dataSource={ this.state.dataSource }
                    rowSelection={ {
                        selectedRowKeys: this.state.selectedRowKeys,
                        onChange: this.onRowSelect,
                        getCheckboxProps: record => ({
                            disabled: record.status === 2 || record.isCobblerHost === true,
                        }),
                    } }
                    scroll={ { y: this.state.scrollY } }
                    columnsProportion={ [1, 2, 2, 3, 2, 1] }
                />
            </Fragment>
        )
    }
}

export default withRouter(HostList)
