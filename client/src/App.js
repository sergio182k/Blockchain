import React, { Component } from "react";
import SimpleStorage from "./build/contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import ipfs from './ipfs'

import "./App.css";

class App extends Component {
  state = { web3: null, accounts: null, contract: null, buffer: null, ipfsHash: ''};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorage.networks[networkId];
      const instance = new web3.eth.Contract(
          SimpleStorage.abi,
        deployedNetwork && deployedNetwork.address,
      );
      console.log('instance', instance);
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };


  runExample = async () => {
      const { contract } = this.state;
      var page1 = document.getElementById("pag1");
      page1.style.display = "none";
      var page2 = document.getElementById("pag2");
      page2.style.display = "none";
      var PNoRegistradoP = document.getElementById("PNoRegistrado");
      PNoRegistradoP.style.display = "none";
  };

  async login(event){
      const { web3, contract } = this.state;
      console.log('w3', web3);
      var docPersonaI = document.getElementById("docPersona").value;
      const response = await contract.methods.login(docPersonaI).call();
      if(response[0] !== "1"){
          console.log("login Successful");
          console.log(response);
          var numberOfDocs = Object.keys(response[2]).length;
          var hashDocs = [];
          for (var i = 0; i < numberOfDocs; i++){
              var hashDoc = web3.utils.toAscii(response[3][i]) + web3.utils.toAscii(response[4][i]);
              hashDocs.push(hashDoc);
          }
          console.log(hashDocs);
          var name = web3.utils.toAscii(response[1]);
          console.log(name);
          var PNoRegistradoP = document.getElementById("PNoRegistrado");
          PNoRegistradoP.style.display = "none";
          var page0 = document.getElementById("pag0");
          page0.style.display = "none";
          var page1 = document.getElementById("pag1");
          page1.style.display = "block";
      }else{
          var PNoRegistradoP = document.getElementById("PNoRegistrado");
          PNoRegistradoP.style.display = "block";
          document.getElementById("docPersona").value = "";
      }
  }

  captureFile(event){
      event.preventDefault();
      const file = event.target.files[0]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
          this.setState({buffer: Buffer(reader.result)})
          console.log('buffer', this.state.buffer);

      }
  }

  goBack(event){
      var page1 = document.getElementById("pag1");
      page1.style.display = 'block';
      var notFoundP = document.getElementById("notFoundPage");
      notFoundP.style.display = "none";
      var resultPageP = document.getElementById("resultPage");
      resultPageP.style.display = "none";
      document.getElementById("personalIdSearch").value = "";
  }

  async onSubmit (event){
      var personalIdA = document.getElementById("personalId").value;
      console.log(personalIdA);
      const { accounts, contract } = this.state;
      event.preventDefault();
      await ipfs.add(this.state.buffer,(error, result)=>{
          if(error){
              console.log(error)
              return
          }
          console.log('result', result)
          this.setState({ipfsHash: result[0].hash})
          contract.methods.set(result[0].hash, personalIdA).send({ from: accounts[0] });
          console.log('ipfsHash', this.state.ipfsHash);
          var page1 = document.getElementById("pag1");
          page1.style.display = 'none';
          var notFoundP = document.getElementById("notFoundPage");
          notFoundP.style.display = "none";
          var resultPageP = document.getElementById("resultPage");
          resultPageP.style.display = "block";
          document.getElementById("personalId").value = "";
      });
  }

  async onSearch(event){
      var page1 = document.getElementById("pag1");
      page1.style.display = 'none';
      var resultPageP = document.getElementById("resultPage");
      const { contract } = this.state;
      console.log('onSearch');
      var personalIdSearchI = document.getElementById("personalIdSearch").value;
      console.log(personalIdSearchI);
      const response = await contract.methods.get(personalIdSearchI).call();
      if(response !== ""){
          resultPageP.style.display = "block";
      }else{
          resultPageP.style.display = "none";
          var notFoundP = document.getElementById("notFoundPage");
          notFoundP.style.display = "block";
      }
      console.log('response', response)
      this.setState({ipfsHash: response})
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
          <br/>
          <br/>
          <br/>
        <h1>Tcs Activos Digitales</h1>
        <br/>
        <br/>
        <div id="pag0">
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <div id="PLogin">
                <h2>Digita tu documento</h2>
                <input type="text" id="docPersona"/>
                <form onSubmit={this.onSubmit}>
                    <br/>
                    <button type="button"onClick={this.login.bind(this)}>Ingresar</button>
                </form>
            </div>
            <div id="PNoRegistrado">
                <br/>
                <h3>No te encuentras registrado</h3>
            </div>
        </div>
        <div id="pag1">
            <div id="add">
                <h3>Agrega tu documento</h3>
                <input name="capture" type="file" onChange={this.captureFile.bind(this)}/>
                <h3>Id asociado</h3>
                <input type="text" id="personalId"/>
                <form onSubmit={this.onSubmit}>
                    <br/>
                    <button type="button"onClick={this.onSubmit.bind(this)}>Guardar</button>
                </form>
            </div>
            <br/>
            <hr width="50%"/>
            <div id="search">
                <h3>Busca tu documento</h3>
                <h3>Id asociado</h3>
                <input type="text" id="personalIdSearch"/>
                <form onSubmit={this.onSubmit}>
                    <br/>
                    <button type="button"onClick={this.onSearch.bind(this)}>Buscar</button>
                </form>
            </div>
        </div>
        <div id="pag2">
            <div id="resultPage">
                <div>
                    <p>Tu docuemnto es:</p>
                    <iframe src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} width="800px" height="500px"></iframe>
                </div>
                <button type="button"onClick={this.goBack.bind(this)}>Volver</button>
            </div>
            <div id="notFoundPage">
                <h3>No hay documentos Asociados</h3>
                <div>
                    <button type="button"onClick={this.goBack.bind(this)}>Volver</button>
                </div>
            </div>
        </div>
      </div>
    );
  }
}

export default App;
