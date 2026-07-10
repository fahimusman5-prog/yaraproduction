-- Public buckets already serve objects by URL. Removing this table policy prevents
-- anonymous users from listing every object path in the product image bucket.
drop policy if exists "Public read product images" on storage.objects;

notify pgrst, 'reload schema';
