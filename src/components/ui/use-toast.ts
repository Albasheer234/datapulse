"use client";

import { useState, useEffect } from "react";

type ToastVariant = "default" | "destructive";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastEventDetail = Omit<ToastProps, "id"> & { id?: string };

const TOAST_EVENT = "app-toast-trigger";

export function toast(props: ToastEventDetail) {
  const event = new CustomEvent(TOAST_EVENT, {
    detail: { ...props, id: props.id || Math.random().toString(36).substring(2, 9) },
  });
  window.dispatchEvent(event);
}

export function useToast() {
  return {
    toast,
  };
}
