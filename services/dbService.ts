
import { supabase } from './supabaseClient';
import { ProductListing, User, Organization } from "../types";

/**
 * Helper to convert Base64 to Blob for upload
 */
const base64ToBlob = async (base64: string, mimeType: string = 'image/jpeg'): Promise<Blob> => {
  const res = await fetch(`data:${mimeType};base64,${base64}`);
  return await res.blob();
};

export const dbService = {
  
  // --- AUTHENTICATION ---

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.email?.split('@')[0] || 'User',
      avatar: profile?.avatar_url
    };
  },

  signUp: async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        name: name,
        avatar_url: `https://ui-avatars.com/api/?name=${name}&background=red&color=fff`
      });
    }
    return {};
  },

  signIn: async (email: string, password: string): Promise<{ user?: User, error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || email.split('@')[0],
        avatar: profile?.avatar_url
      }
    };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  // --- ORGANIZATIONS ---

  getOrganizations: async (userId: string): Promise<Organization[]> => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId);
    
    if (error || !data) return [];
    
    return data.map((org: any) => ({
      id: org.id,
      ownerId: org.owner_id,
      name: org.name,
      logoUrl: org.logo_url
    }));
  },

  createOrganization: async (name: string, ownerId: string): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        owner_id: ownerId,
        logo_url: `https://ui-avatars.com/api/?name=${name}&background=random`
      })
      .select()
      .single();

    if (error) return null;
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      logoUrl: data.logo_url
    };
  },

  // --- PRODUCTS ---

  getProducts: async (): Promise<ProductListing[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, organizations(name)') // Join with org name
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      sellerId: item.seller_id,
      sellerName: item.organizations?.name || item.seller_name, // Use Org name if exists
      organizationId: item.organization_id,
      title: item.title,
      description: item.description,
      price: item.price,
      currency: item.currency,
      category: item.category,
      imageUrl: item.image_url,
      videoUrl: item.video_url,
      views: item.views,
      createdAt: item.created_at
    }));
  },

  getUserProducts: async (userId: string): Promise<ProductListing[]> => {
    // Get products where seller_id is user OR organization owner is user
    const { data, error } = await supabase
      .from('products')
      .select('*, organizations(name)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map((item: any) => ({
      id: item.id,
      sellerId: item.seller_id,
      sellerName: item.organizations?.name || item.seller_name,
      organizationId: item.organization_id,
      title: item.title,
      description: item.description,
      price: item.price,
      currency: item.currency,
      category: item.category,
      imageUrl: item.image_url,
      videoUrl: item.video_url,
      views: item.views,
      createdAt: item.created_at
    }));
  },

  deleteProduct: async (productId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) return { error: error.message };
    return {};
  },

  incrementView: async (productId: string) => {
    const { data } = await supabase.from('products').select('views').eq('id', productId).single();
    if (data) {
      await supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', productId);
    }
  },

  createProduct: async (
    product: Omit<ProductListing, 'id' | 'createdAt' | 'views'>, 
    imageBase64: string, 
    videoBlobUrl?: string
  ): Promise<void> => {
    
    // 1. Upload Image
    const imageBlob = await base64ToBlob(imageBase64, 'image/jpeg');
    const imageFileName = `${product.sellerId}/${Date.now()}_img.jpg`;
    
    const { error: imgError } = await supabase.storage
      .from('media')
      .upload(imageFileName, imageBlob);

    if (imgError) throw new Error("Image upload failed: " + imgError.message);

    const { data: imgUrlData } = supabase.storage.from('media').getPublicUrl(imageFileName);
    const publicImageUrl = imgUrlData.publicUrl;

    // 2. Upload Video (if exists)
    let publicVideoUrl = null;
    if (videoBlobUrl) {
      const videoBlob = await (await fetch(videoBlobUrl)).blob();
      const videoFileName = `${product.sellerId}/${Date.now()}_vid.mp4`;
      
      const { error: vidError } = await supabase.storage
        .from('media')
        .upload(videoFileName, videoBlob);
      
      if (!vidError) {
        const { data: vidUrlData } = supabase.storage.from('media').getPublicUrl(videoFileName);
        publicVideoUrl = vidUrlData.publicUrl;
      }
    }

    // 3. Insert into DB
    const { error: dbError } = await supabase.from('products').insert({
      seller_id: product.sellerId,
      organization_id: product.organizationId, // Save the org ID
      seller_name: product.sellerName,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      category: product.category,
      image_url: publicImageUrl,
      video_url: publicVideoUrl,
      views: 0
    });

    if (dbError) throw new Error("Database insert failed: " + dbError.message);
  }
};
