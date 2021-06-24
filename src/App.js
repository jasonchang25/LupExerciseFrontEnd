import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MaterialTable from 'material-table'

function App() {
  const [responseMessage, setResponseMessage] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState([])
  const columns = [
    { title: "ID", field: "eventId", editable:false },
    { title: "Event Name", field: "eventName", validate: rowData => rowData.eventName === '' ? 'Event name cannot be empty' : '' },
    { title: "Event Description", field: "eventDescription", validate: rowData => rowData.Description === '' ? 'Event description cannot be empty' : '' }, 
    { title: "Event Timezone", field: "eventTimezone" }, 
    { title: "Start Date", field: "startDate", type: "date",  render: rowData => new Date(rowData.startDate + 'Z').toLocaleDateString(), validate: rowData => rowData.endDate < rowData.startDate ? 'Event start date cannot be after event end date' : '' },
    { title: "End Date", field: "endDate", type: "date", render: rowData => new Date(rowData.endDate + 'Z').toLocaleDateString(), validate: rowData => rowData.endDate < rowData.startDate ? 'Event end date cannot be before event end date' : ''},
    { title: "Created Date", field: "createdDate", editable:false, type: "date", render: rowData => new Date(rowData.createdDate + 'Z').toLocaleDateString()},
    { title: "Modified Date", field: "modifiedDate", editable:false, type: "date", render: rowData => new Date(rowData.modifiedDate + 'Z').toLocaleDateString()},
  ] 
  const options = {
    headers: {'X-Custom-Header': 'value'}
  };

  useEffect(() => {
    fetch("https://localhost:44334/api/Event/GetAllEvents")
    .then(resp => resp.json())
    .then(resp => {   
      setData(resp);
    })
  },[refresh])


  return (
    <div className="App">
      <h1 align="center">React-App</h1>
      <h4 align='center'>Material Table</h4>
      <h4 align='center' style={{ color: 'orange' }}>{responseMessage}</h4>
      <MaterialTable
        title="Event Data"
        data={data}
        columns={columns}
        editable={{
          onRowAdd:(newRow) => new Promise((resolve,reject) => {            
            newRow.startDate = newRow.startDate.toISOString().slice(0, -1);
            newRow.endDate = newRow.endDate.toISOString().slice(0, -1);                   
            axios.post('https://localhost:44334/api/Event/CreateEvent', newRow, options)
              .then(response => {        
                setResponseMessage(response?.data?.message ?? "")          
                setRefresh(true); // Only need to reset hook here to get back new entry with ID, all the rest can be done on front end to save resources on calling
                setTimeout(() => {
                  resolve();              
                });
              })
              .catch((response) => {
                setResponseMessage(response.message); 
                resolve();
              });
          }),
          onRowDelete:selectedRow => new Promise((resolve,reject) => {
            const index=selectedRow.tableData.id;
            const updatedRows=[...data];
            updatedRows.splice(index,1)
            const id = selectedRow.eventId;
            axios.post('https://localhost:44334/api/Event/DeleteEventById?id=' + id, options)
              .then(response => {    
                setResponseMessage(response?.data?.message ?? "")              
                setTimeout(() => {
                  setData(updatedRows);
                  resolve();              
                });
              })
              .catch((response) => {
                setResponseMessage(response.message); 
                resolve();
              });
          }),
          onRowUpdate:(updatedRow,oldRow) => new Promise((resolve,reject) =>{
            if (typeof(updatedRow.startDate) == "object"){
              updatedRow.startDate = updatedRow.startDate.toISOString().slice(0, -1);
            }
            if (typeof(updatedRow.endDate) == "object"){
              updatedRow.endDate = updatedRow.endDate.toISOString().slice(0, -1);
            }
            updatedRow.modifiedDate = new Date().toISOString().slice(0, -1);
            const index = oldRow.tableData.id;
            const updatedRows = [...data];
            updatedRows[index] = updatedRow;
            axios.post('https://localhost:44334/api/Event/UpdateEvent', updatedRow, options)
              .then(response => {  
                setResponseMessage(response?.data?.message ?? "")                    
                setTimeout(() => {
                  setData(updatedRows);
                  resolve();              
                });
              })
              .catch((response) => {
                setResponseMessage(response.message); 
                resolve();
              });
          })
        }}
        options={{
          actionsColumnIndex:-1, addRowPosition:"first", emptyRowsWhenPaging: true, pageSize: 10, paging: true
        }}
      />
    </div>
  );
}

export default App;
