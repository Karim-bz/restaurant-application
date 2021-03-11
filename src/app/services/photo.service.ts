import { Injectable } from '@angular/core';
import {
  Plugins,
  CameraResultType,
  Capacitor,
  FilesystemDirectory,
  CameraPhoto,
  CameraSource,
} from '@capacitor/core';
import { ModalController, Platform } from '@ionic/angular';
import { CategoryModalComponent } from '../category-modal/category-modal.component';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private platform: Platform;
  choosenCategory;

  constructor(platform: Platform, private modalCtrl: ModalController) {
    this.platform = platform;
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent,
    });

    modal.onDidDismiss().then(async (data) => {
      // const categorie = data['data'];
      this.choosenCategory = data['data'];
      console.log(this.choosenCategory);
      this.savedImageFile = await this.savePicture(this.capturedPhoto);
      // await this.openModal();
      this.photos.unshift(this.savedImageFile);
      // console.log('save', this.photos);

      Storage.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos),
      });
      // console.log('this is Photo service +', categorie);
      // console.log(this.choosenCategory);
    });
    await modal.present();
  }
  savedImageFile:Photo;
  capturedPhoto:any
  public async addNewToGallery() {
    // Take a photo
  this.capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100, // highest quality (0 to 100)
    });
    // Save the picture and add it to photo collection
    this.openModal()
    // console.log(this.photos[0].category)
  }

  // Save picture to file on device
  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data,
    });
    const photoCategory = this.choosenCategory;

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        category: photoCategory,
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath,
        category: photoCategory,
      };
    }
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path,
      });

      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  public async loadSaved() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    // Easiest way to detect when running on the web:
    // “when the platform is NOT hybrid, do this”
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      for (let photo of this.photos) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: FilesystemDirectory.Data,
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
    // console.log(this.photos);
  }


  // public async editPicture(oldPic, newPicCat) {
  //   const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
  //   this.photos = JSON.parse(photoList.value) || [];
  //   for (let i = 0; i < this.photos.length; i++) {
  //     // alert(this.photos[i].filepath);
  //     console.log(this.photos[i]);
  //     if (this.photos[i].filepath == oldPic.filepath) {
  //       this.photos[i].category = newPicCat;
  //     }
  //   }
  //   // Update photos array cache by overwriting the existing photo array
  //   Storage.set({
  //     key: this.PHOTO_STORAGE,
  //     value: JSON.stringify(this.photos),
  //   });
  // }

  public async deletePicture(photo: Photo, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data,
    });
  }
}

export interface Photo {
  filepath: string;
  webviewPath: string;
  category: string;
}
