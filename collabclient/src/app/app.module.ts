import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { RoomComponent } from './room/room.component';
import { RoomService } from './services/room.service';
import { SocketService } from './services/socket.service';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RoomComponent
  ],
  providers: [RoomService, SocketService],
})
export class AppModule { }
