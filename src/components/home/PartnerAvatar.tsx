import type { Partner } from "@/lib/api/types";

/**
 * Shared circular avatar for the partner's profile photo — shows
 * partner.profilePhotoKey when set (despite the field name, this is
 * already a ready-to-use, cache-busted CDN URL by the time it reaches
 * here: see PersonalInfoTab's upload flow, which PATCHes cdnUrl(r2Key)
 * into that field), else falls back to their name's initial. Used
 * anywhere a pfp shows up — Sidebar, the Home header, Topbar, and the
 * Profile page itself — so all of them update together.
 *
 * `photoUrl` lets a caller override with a freshly-cropped local preview
 * before a refetch of `partner` lands (see DesktopProfilePage /
 * PersonalInfoTab) — falls back to partner.profilePhotoKey when absent.
 *
 * `className` supplies sizing, background, border and text-color/size —
 * this component only owns the shape and image-vs-initials logic.
 */
export default function PartnerAvatar({
  partner,
  photoUrl,
  className = "",
}: {
  partner: Pick<Partner, "name" | "profilePhotoKey">;
  photoUrl?: string | null;
  className?: string;
}) {
  const initials = (partner.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const src = photoUrl ?? partner.profilePhotoKey ?? null;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold overflow-hidden ${className}`}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}
