import { Module } from "@nestjs/common";
import { StaffAccountsController } from "./staff-accounts.controller";
import { StaffAccountsService } from "./staff-accounts.service";

@Module({ controllers: [StaffAccountsController], providers: [StaffAccountsService] })
export class StaffAccountsModule {}
