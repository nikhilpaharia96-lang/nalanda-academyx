import { Module } from "@nestjs/common";
import { FeesController } from "./fees.controller";
import { FeesService } from "./fees.service";
import { ConcessionsModule } from "../concessions/concessions.module";

@Module({
  imports: [ConcessionsModule],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
