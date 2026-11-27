import { NotFoundContent } from "@/components/not-found-content"

// notFound() in a public page (e.g. an unpublished article), inside the public layout and its
// <main> (R3.4).
export default function PublicNotFound() {
  return <NotFoundContent />
}
