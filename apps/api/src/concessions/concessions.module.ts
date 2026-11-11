import { Module } from "@nestjs/common";
import { ConcessionsController } from "./concessions.controller";
import { ConcessionsService } from "./concessions.service";

@Module({ controllers: [ConcessionsController], providers: [ConcessionsService], exports: [ConcessionsService] })
export class ConcessionsModule {}
