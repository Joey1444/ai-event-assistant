"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createProject(formData: FormData) {
  const projectName = text(formData.get("projectName"));
  const organization = text(formData.get("organization"));

  if (!projectName || !organization) {
    redirect("/projects/new?error=missing-required");
  }

  const project = await prisma.project.create({
    data: {
      projectName,
      organization,
      brief: { create: briefData(formData) },
    },
  });

  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  const id = text(formData.get("id"));
  if (!id) {
    redirect("/");
  }

  const projectName = text(formData.get("projectName"));
  const organization = text(formData.get("organization"));
  if (!projectName || !organization) {
    redirect(`/projects/${id}/edit?error=missing-required`);
  }

  await prisma.project.update({
    where: { id },
    data: {
      projectName,
      organization,
      brief: {
        upsert: {
          create: briefData(formData),
          update: briefData(formData),
        },
      },
    },
  });

  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  const id = text(formData.get("id"));
  if (id) {
    await prisma.project.delete({ where: { id } });
  }
  redirect("/");
}

function text(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function briefData(formData: FormData) {
  return {
    eventType: text(formData.get("eventType")),
    eventDate: text(formData.get("eventDate")),
    expectedParticipants: text(formData.get("expectedParticipants")),
    budget: text(formData.get("budget")),
    location: text(formData.get("location")),
    targetAudience: text(formData.get("targetAudience")),
    objective: text(formData.get("objective")),
    requirements: text(formData.get("requirements")),
    notes: text(formData.get("notes")),
  };
}
