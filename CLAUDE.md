# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a WeChat Mini Program course booking system backed by Tencent CloudBase. The current branch is adapting the original generic course/activity booking app toward a daycare-oriented booking and education-management MVP with parent, teacher, and admin flows.

The app is not a conventional web app with a root Node build. Frontend compilation, preview, upload, and cloud-function deployment are primarily done through WeChat Developer Tools using `project.config.json`.

## Development commands

- Install cloud-function dependencies:
  ```sh
  cd cloudfunctions/cloud && npm install
  ```
- There is no working automated test suite currently. The only package script is a placeholder and fails intentionally:
  ```sh
  cd cloudfunctions/cloud && npm test
  ```
- Open/run locally: import the repository root in WeChat Developer Tools. `project.config.json` sets `miniprogramRoot` to `miniprogram/` and `cloudfunctionRoot` to `cloudfunctions/`.
- Deploy backend: in WeChat Developer Tools, upload/deploy the `cloudfunctions/cloud` function named `cloud`.
- Smoke backend routes after deployment through the mini program/cloud function. Useful test routes are registered in `cloudfunctions/cloud/config/route.js`, including `test/test` and `test/meet_test_join`.

## High-level architecture

### Frontend mini program

- `miniprogram/app.js` initializes `wx.cloud` with `setting.CLOUD_ID` from `miniprogram/setting/setting.js`.
- `miniprogram/app.json` is the page registry. User-facing pages live under `miniprogram/projects/A00/`; admin pages live under `miniprogram/pages/admin/`.
- `miniprogram/projects/A00/` contains the public/parent-side project skin and pages such as home, news, calendar, meeting/course booking, profile, children, joins, and leave.
- `miniprogram/pages/admin/` contains admin and teacher-side pages. Current daycare additions include `pages/admin/daycare/leave` and `pages/admin/daycare/teacher`.
- `miniprogram/biz/` holds frontend business facades used by pages. `passport_biz.js` handles admin login and common page initialization; `meet_biz.js`/`admin_meet_biz.js` wrap booking flows.
- `miniprogram/helper/cloud_helper.js` is the frontend RPC wrapper. It always calls the single cloud function `cloud` with `{ route, token, PID, params }`, adds admin/user tokens from local cache, and normalizes response codes.
- `miniprogram/cmpts/`, `behavior/`, `helper/`, `tpls/`, and `style/` provide shared UI components, page behaviors, utilities, templates, and styles.

### Cloud function backend

- The backend is a single CloudBase function at `cloudfunctions/cloud/index.js`, which delegates every request to `framework/core/application.js`.
- `cloudfunctions/cloud/config/route.js` maps string routes such as `meet/list`, `my/child_save`, and `admin/leave_status` to `controller@method` handlers. Routes suffixed with `#noDemo` are blocked when `config.IS_DEMO` is true.
- Request flow is: mini program `cloud_helper` -> cloud function `index.js` -> `application.app()` -> route lookup -> controller instance -> service -> model/database.
- Controllers live in `cloudfunctions/cloud/project/controller/`. Admin controllers are in `project/controller/admin/`. Controllers validate input using `BaseController.validateData()` and delegate business rules to services.
- Services live in `cloudfunctions/cloud/project/service/`. Admin services are in `project/service/admin/`. Services implement business logic and use model classes for persistence.
- Models live in `cloudfunctions/cloud/project/model/`. Each model declares collection name (`CL`), field prefix, status constants, and `DB_STRUCTURE`. `BaseModel` automatically scopes queries by `_pid` using `global.PID` unless a call opts out with `mustPID = false`.
- Database collections are Tencent cloud database collections, not SQL tables. `cloudfunctions/cloud/config/config.js` lists collections in `COLLECTION_NAME`; startup initialization in `BaseService.initSetup()` creates missing collections and seed setup data.
- `framework/database/model.js` and `db_util.js` provide generic CRUD, pagination, aggregation, and join helpers. Prefer existing model helpers over direct database calls when adding business code.

## Important configuration

- Frontend cloud environment: `miniprogram/setting/setting.js` (`CLOUD_ID`, `PID`, subscription template IDs, cache/content-check flags).
- Backend cloud environment and admin defaults: `cloudfunctions/cloud/config/config.js` (`CLOUD_ID`, `ADMIN_NAME`, `ADMIN_PWD`, `PID`, `IS_DEMO`, `TEST_MODE`, collection list, cache settings).
- Route registration is manual. Adding a backend controller method is not enough; add the route to `cloudfunctions/cloud/config/route.js` and call the same route string from the mini program.
- `PID` is currently `A00` and is used for multi-project/tenant scoping. Data model operations default to filtering by `_pid`.

## Current daycare MVP context

The repo includes `DEVELOPMENT_SPEC.md` and `DEVELOPMENT_PLAN.md` describing the daycare adaptation. MVP scope includes: admin-created courses/time slots with teacher/place/age metadata, parent child binding, child-specific booking and cancellation, leave requests, teacher today schedule/student list/check-in, basic admin attendance/booking visibility, and WeChat subscription-message hooks.

Recent model additions include `child_model.js` and `leave_model.js`; route additions include `my/child_*`, `my/leave_*`, `admin/teacher_today`, and `admin/leave_*`.

## Working conventions in this codebase

- Preserve the existing CommonJS style (`require`, `module.exports`) and tab indentation.
- Mini program page files use matching `js/wxml/wxss/json` basenames and are registered in `miniprogram/app.json` when navigable.
- Backend field names use model prefixes such as `MEET_`, `JOIN_`, `CHILD_`, and `LEAVE_`; keep model `DB_STRUCTURE` and service/controller expectations aligned.
- Admin-only write routes generally carry `#noDemo` in `route.js`; follow the same pattern for new admin mutations.
- For UI changes, verify in WeChat Developer Tools or explicitly state that the mini program could not be run in this environment.
