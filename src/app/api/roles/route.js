import RoleController from "@/src/backend/controller/role-controller";
import { NextResponse } from "next/server";


export function GET(request) {
  const roleController = new RoleController();
  const roles = roleController.getAll();
  return NextResponse.json({ data: roles });
}