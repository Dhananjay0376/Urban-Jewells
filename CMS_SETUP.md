# CMS Setup

This project is now CMS-ready with Sanity as the catalog source.

## How it works

- If `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` are set, the app fetches products, collections, and categories from Sanity.
- If Sanity is not configured or the fetch fails, the app falls back to the current hardcoded catalog in `UrbanJewells.jsx`.

## Env Vars

Copy `.env.example` to `.env` and set:

- `VITE_SANITY_PROJECT_ID`
- `VITE_SANITY_DATASET`
- `VITE_SANITY_API_VERSION`
- `VITE_SANITY_USE_CDN`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

## Sanity Document Types

Create these document types in Sanity:

### `product`

Required fields:

- `id` number or string
- `name` string
- `slug` slug
- `price` number
- `originalPrice` number
- `category` reference to `category`
- `collection` reference to `collection`
- `shortDescription` text
- `materials` array of strings
- `sizes` array of strings
- `images` array of images
- `inStock` boolean
- `isFeatured` boolean
- `isNew` boolean
- `isSale` boolean
- `rating` number
- `reviewCount` number
- `tags` array of strings

### `collection`

Required fields:

- `id` string
- `name` string
- `slug` slug
- `tagline` string
- `coverImage` image
- `productCount` number
- `mood` string

### `category`

Required fields:

- `id` string
- `name` string
- `slug` slug
- `icon` string
- `coverImage` image

## Next step

Once your Sanity project is ready, the product workflow becomes:

1. Add product in Sanity Studio.
2. Publish it.
3. Refresh the storefront.

No code edit is needed for catalog updates after that.
