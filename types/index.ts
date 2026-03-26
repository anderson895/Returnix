export type UserRole = 'user' | 'security' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ItemCategory =
  | 'Electronics'
  | 'Clothing & Accessories'
  | 'Bags & Wallets'
  | 'Documents & IDs'
  | 'Jewelry'
  | 'Keys'
  | 'Glasses & Eyewear'
  | 'Sports Equipment'
  | 'Books & Stationery'
  | 'Others'

export type LostItemStatus = 'searching' | 'found' | 'claimed' | 'closed'

export interface LostItem {
  id: string
  user_id: string
  title: string
  description: string | null
  category: ItemCategory
  date_lost: string
  location_lost: string
  image_url: string | null
  color: string | null
  brand: string | null
  status: LostItemStatus
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type FoundItemStatus = 'unclaimed' | 'pending' | 'claimed'

export interface FoundItem {
  id: string
  security_id: string | null
  title: string
  description: string | null
  category: ItemCategory
  date_found: string
  location_found: string
  image_url: string | null
  color: string | null
  brand: string | null
  tracking_id: string
  status: FoundItemStatus
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export interface ClaimRequest {
  id: string
  user_id: string
  found_item_id: string
  lost_item_id: string | null
  proof_description: string
  proof_image_url: string | null
  status: ClaimStatus
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  found_items?: FoundItem
  lost_items?: LostItem
  verifier?: Profile
}

export type NotificationType =
  | 'claim_approved'
  | 'claim_rejected'
  | 'item_found'
  | 'claim_submitted'
  | 'info'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  related_item_id: string | null
  related_type: string | null
  created_at: string
}

export interface DashboardStats {
  totalLostItems: number
  totalFoundItems: number
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  rejectedClaims: number
  totalUsers: number
  recoveryRate: number
}
