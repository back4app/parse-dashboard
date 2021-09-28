
export default class CloudCodeChanges {

  constructor(){
    this.files = [];
  }

  addFile( fileName ) {
    this.files = this.files.filter(f => f !== fileName);
    this.files = [ ...this.files, fileName ];
  }

  getFiles() {
    return this.files;
  }

}
