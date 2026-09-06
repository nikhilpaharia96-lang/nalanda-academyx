import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";

import { StoreCategoriesService } from "./store-categories.service";
import { StoreCategoriesController } from "./store-categories.controller";

import { StoreProductsService } from "./store-products.service";
import { StoreProductsController, StoreCatalogController } from "./store-products.controller";

import { StoreInventoryService } from "./store-inventory.service";
import { StoreInventoryController } from "./store-inventory.controller";

import { StoreCartService } from "./store-cart.service";
import { StoreCartController } from "./store-cart.controller";

import { StoreOrdersService } from "./store-orders.service";
import { StoreOrdersController } from "./store-orders.controller";

import { StoreCouponsService } from "./store-coupons.service";
import { StoreCouponsController } from "./store-coupons.controller";

import { StoreBundlesService } from "./store-bundles.service";
import { StoreBundlesController, StoreBundlesCatalogController } from "./store-bundles.controller";

import { StoreSettingsService } from "./store-settings.service";
import { StoreSettingsController } from "./store-settings.controller";

import { StoreDashboardService } from "./store-dashboard.service";
import { StoreDashboardController, StoreReportsController } from "./store-dashboard.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [
    StoreCategoriesController,
    StoreProductsController,
    StoreCatalogController,
    StoreInventoryController,
    StoreCartController,
    StoreOrdersController,
    StoreCouponsController,
    StoreBundlesController,
    StoreBundlesCatalogController,
    StoreSettingsController,
    StoreDashboardController,
    StoreReportsController,
  ],
  providers: [
    StoreCategoriesService,
    StoreProductsService,
    StoreInventoryService,
    StoreCartService,
    StoreOrdersService,
    StoreCouponsService,
    StoreBundlesService,
    StoreSettingsService,
    StoreDashboardService,
  ],
  // StoreOrdersService is consumed by PaymentsModule so a paid Razorpay
  // order can confirm the matching store order + deduct inventory, without
  // building a second payment pipeline (see PaymentsService.markPaid).
  exports: [StoreOrdersService, StoreSettingsService],
})
export class StoreModule {}
