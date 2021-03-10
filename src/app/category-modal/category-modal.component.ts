import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  styleUrls: ['./category-modal.component.scss'],
})
export class CategoryModalComponent implements OnInit {
  pic;
  categoryList = [
    { id: 0, name: 'cars' },
    { id: 1, name: 'family' },
    { id: 2, name: 'friends' },
  ];
  constructor(
    public modalCtrl: ModalController,
    private photoService: PhotoService
  ) {}

  selectedCategory;

  ngOnInit() {}

  // categoryChoosed(item) {
  //   item = this.selectedCategory;
  //   this.modalCtrl.dismiss(item);
  //   // console.log('category Choosed in the modal:', item);
  // }

  getCategory($event) {
    // console.log($event.target.value);
    this.selectedCategory = $event.target.value;
    // console.log(this.selectedCategory);
    // this.photoService.editPicture(this.pic, this.selectedCategory);
    this.modalCtrl.dismiss(this.selectedCategory);
    // this.modalCtrl.dismiss(this.selectedCategory);
  }
}
