import { Module } from "@nestjs/common";
import { AttendxController } from "./attendx.controller";
import { AttendxService } from "./attendx.service";

@Module({ controllers: [AttendxController], providers: [AttendxService] })
export class AttendxModule {}
