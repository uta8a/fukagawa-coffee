import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from 'src/app/services/customer.service';
import { ItemService } from 'src/app/services/item.service';
import { OrderService } from 'src/app/services/order.service';
import { Customer } from 'src/models/customer.model';
import { Item } from 'src/models/item.model';
import { Order } from 'src/models/order.model';
import firebase from 'firebase/app';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
})
export class NewOrderComponent implements OnInit {
  customer: Customer | undefined;
  items: Partial<Item & { orderedCount: number }>[] = [];
  order: Omit<Order, 'id'> = {
    orderedAt: firebase.firestore.Timestamp.fromDate(new Date()),
    customerId: '',
    customerName: '',
    items: [],
    notes: '',
    isDone: false,
  };
  sending = false;

  constructor(
    private route: ActivatedRoute,
    private cs: CustomerService,
    private is: ItemService,
    private os: OrderService,
    private fire: AngularFirestore,
    private sb: MatSnackBar
  ) {
    this.cs
      .load(this.route.snapshot.paramMap.get('id') || '_')
      .subscribe((customer) => {
        this.customer = customer;

        if (!customer) return;
        this.order.customerId = customer.id;
        this.order.customerName = customer.name;
        const items = Object.keys(customer.items || {});
        if (items.length) {
          this.is
            .list((ref) => ref.where('id', 'in', items))
            .subscribe((items) => {
              this.items = items;
            });
        }
      });
  }

  ngOnInit(): void {}

  addItem() {
    this.items.push({
      orderedCount: 1,
      name: '',
    });
  }

  sendOrder() {
    this.sending = true;
    this.order.orderedAt = firebase.firestore.Timestamp.fromDate(new Date());
    this.order.items = this.items
      .map((item) => ({
        id: item.id || '',
        name: item.name || '',
        orderedCount: item.orderedCount || 0,
      }))
      .filter((item) => item.orderedCount);
    this.os.store(Object.assign({ id: this.fire.createId() }, this.order)).then(
      () => {
        this.sb.open('注文を送信しました', undefined, {
          duration: 3000,
        });
      },
      () => {
        this.sending = false;
      }
    );
  }
}
