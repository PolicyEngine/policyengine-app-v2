import type { Metadata } from "next";
import BrandDesignClient from "./BrandDesignClient";

export const metadata: Metadata = {
  title: "Design system",
};

export default function BrandDesignPage() {
  return <BrandDesignClient />;
}
