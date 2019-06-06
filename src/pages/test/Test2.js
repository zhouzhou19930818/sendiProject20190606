import React from 'react';
import { Table } from 'antd';


export default class Test extends React.Component {
    componentDidMount() {

    }

    render() {
        const renderContent = (value, row, index) => {
            return {
                children: value,
                props: {
                    colSpan: index >= 4 ? 0 : undefined,
                },
            };
        };
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onCell: (record, index) => {
                    console.log(record, index);
                    return {
                        style: {
                            color: 'red',
                            background: index >= 4 ? 'pink' : 'transparent'
                        }
                    }
                },
                render: (text, row, index) => {
                    if (index < 4) {
                        return text;
                    }
                    return {
                        children: text,
                        props: {
                            colSpan: index >= 4 ? 5 : undefined,
                        },
                    };
                },
            },
            {
                title: 'Age',
                dataIndex: 'age',
                render: renderContent,
            },
            {
                title: 'Home phone',
                dataIndex: 'tel',
                render: renderContent,
            },
            {
                title: 'Phone',
                dataIndex: 'phone',
                render: renderContent,
            },
            {
                title: 'Address',
                dataIndex: 'address',
                render: renderContent,
            },
        ];

        const data = [
            {
                key: '1',
                name: 'John Brown',
                age: 32,
                tel: '0571-22098909',
                phone: 18889898989,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'Jim Green',
                tel: '0571-22098333',
                phone: 18889898888,
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'Joe Black',
                age: 32,
                tel: '0575-22098909',
                phone: 18900010002,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'Jim Red',
                age: 18,
                tel: '0575-22098909',
                phone: 18900010002,
                address: 'London No. 2 Lake Park',
            },
            {
                key: '5',
                name: 'Jake White',
                age: 18,
                tel: '0575-22098909',
                phone: 18900010002,
                address: 'Dublin No. 2 Lake Park',
            },
            {
                key: '6',
                name: 'Syone Lu',
                age: 18,
                tel: '0575-22098909',
                phone: 18900010002,
                address: 'Dublin No. 2 Lake Park',
            },
        ];
        return <Table
            columns={ columns }
            dataSource={ data }
            bordered
        />
    }
}