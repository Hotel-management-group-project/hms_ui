// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Component } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-profile',
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './profile.html',
})
export class ProfileComponent {}
