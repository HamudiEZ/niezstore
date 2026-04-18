"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Pagination from "./pagination";

export default function SearchPagination(props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <Pagination {...props} onPageChange={handlePageChange} />;
}
