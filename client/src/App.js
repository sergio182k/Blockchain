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

    const { accounts, contract } = this.state;

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call()
    console.log('response', response)
    this.setState({ipfsHash: response})

  };

  captureFile(event){
      event.preventDefault()
      const file = event.target.files[0]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
          this.setState({buffer: Buffer(reader.result)})
          console.log('buffer', this.state.buffer);
      }
  }

  async onSubmit (event){
      const { accounts, contract } = this.state;
      event.preventDefault();
      await ipfs.files.add(this.state.buffer,(error, result)=>{
          if(error){
              console.log(error)
              return
          }
          console.log('result', result)
          this.setState({ipfsHash: result[0].hash})
          contract.methods.set(result[0].hash).send({ from: accounts[0] })
          console.log('ipfsHash', this.state.ipfsHash);
      });

  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Ipfs Image Uploader</h1>
        <h2>Your Image</h2>
        <p>This image is retrieved from IPFS</p>
        <iframe src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} width="800px" height="2100px"></iframe>
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit}>
            <input type="file" onChange={this.captureFile.bind(this)}/>
            <input type="submit" onClick={this.onSubmit.bind(this)}/>
        </form>
      </div>
    );
  }


}

export default App;
