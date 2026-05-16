import { DashboardService } from "./service";
import { DashboardModel } from "./model";
import { errorResponse, successResponse } from "@/libs/response";
import { createBaseApp, createProtectedApp } from "@/libs/base";

const protectedDashboard = createProtectedApp()
  .get(
    "/",
    async ({ set, log, locale }) => {
      const dashboard = await DashboardService.getDashboard(log);
      return successResponse(
        set,
        dashboard,
        { key: "dashboard.dashboardSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      response: {
        200: DashboardModel.dashboard,
        500: DashboardModel.error,
      },
    },
  )
  .get(
    "/dosen",
    async ({ user, set, log, locale }) => {
      // Pass the authenticated lecturer's user ID down to the service
      const dashboard = await DashboardService.getLecturerDashboard(log);
      return successResponse(
        set,
        dashboard,
        { key: "dashboard.lecturerDashboardSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      response: {
        200: DashboardModel.lecturerDashboard,
        500: DashboardModel.error,
      },
    },
  )
  .get(
    "/mahasiswa",
    async ({ user, set, log, locale }) => {
      // Pass the authenticated student's user ID down to the service
      const dashboard = await DashboardService.getStudentDashboard(
        user.id,
        log,
      );
      return successResponse(
        set,
        dashboard,
        { key: "dashboard.studentDashboardSuccess" },
        200,
        undefined,
        locale,
      );
    },
    {
      response: {
        200: DashboardModel.studentDashboard,
        500: DashboardModel.error,
      },
    },
  )
  .onError(({ error, set }) => {
    console.log("ERROR: ", error);
    return errorResponse(set, 500, { key: "common.internalServerError" }, null);
  });

export const dashboard = createBaseApp({ tags: ["Dashboard"] }).group(
  "/dashboard",
  (app) => app.use(protectedDashboard),
);
