import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Créer un client Supabase avec la clé de service pour avoir les permissions admin
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Désactiver la confirmation d'email
    await supabase.auth.admin.updateConfig({
      config: {
        email_confirmation_required: false,
      },
    })

    // Vérifier si les tables nécessaires existent déjà
    const { data: existingTables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    const tableNames = existingTables?.map((table) => table.table_name) || []

    console.log("Existing tables:", tableNames)

    // Créer la table users si elle n'existe pas
    if (!tableNames.includes("users")) {
      console.log("Creating users table...")
      await supabase.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          is_qojim BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    }

    // Créer la table movies si elle n'existe pas
    if (!tableNames.includes("movies")) {
      console.log("Creating movies table...")
      await supabase.query(`
        CREATE TABLE movies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          poster_url TEXT,
          release_year INTEGER,
          director VARCHAR(255),
          synopsis TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    }

    // Créer la table reviews si elle n'existe pas
    if (!tableNames.includes("reviews")) {
      console.log("Creating reviews table...")
      await supabase.query(`
        CREATE TABLE reviews (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          movie_tmdb_id VARCHAR(255) NOT NULL,
          movie_title VARCHAR(255) NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          rating INTEGER CHECK (rating >= 0 AND rating <= 10),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    }

    // Créer la table review_comments si elle n'existe pas
    if (!tableNames.includes("review_comments")) {
      console.log("Creating review_comments table...")
      await supabase.query(`
        CREATE TABLE review_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
          author_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    } else {
      // Vérifier si la colonne user_id existe déjà
      const { data: columnExists } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_schema", "public")
        .eq("table_name", "review_comments")
        .eq("column_name", "user_id")

      // Si la colonne n'existe pas, l'ajouter
      if (!columnExists || columnExists.length === 0) {
        console.log("Adding user_id column to review_comments table...")
        await supabase.query(`
          ALTER TABLE review_comments 
          ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        `)
      }
    }

    // Créer la table watchlist si elle n'existe pas
    if (!tableNames.includes("watchlist")) {
      console.log("Creating watchlist table...")
      await supabase.query(`
        CREATE TABLE watchlist (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          movie_tmdb_id VARCHAR(255) NOT NULL,
          movie_title VARCHAR(255) NOT NULL,
          movie_poster_path TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, movie_tmdb_id)
        );
      `)
    }

    // Créer un trigger pour mettre à jour le champ updated_at si ce n'est pas déjà fait
    await supabase.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Vérifier si les triggers existent déjà
    const { data: existingTriggers } = await supabase
      .from("information_schema.triggers")
      .select("trigger_name")
      .eq("trigger_schema", "public")

    const triggerNames = existingTriggers?.map((trigger) => trigger.trigger_name) || []

    // Appliquer les triggers s'ils n'existent pas déjà
    if (!triggerNames.includes("update_users_updated_at")) {
      await supabase.query(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
    }

    if (!triggerNames.includes("update_movies_updated_at")) {
      await supabase.query(`
        CREATE TRIGGER update_movies_updated_at
        BEFORE UPDATE ON movies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
    }

    if (!triggerNames.includes("update_reviews_updated_at")) {
      await supabase.query(`
        CREATE TRIGGER update_reviews_updated_at
        BEFORE UPDATE ON reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
    }

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès",
      tables: tableNames,
    })
  } catch (error: any) {
    console.error("Erreur lors de l'initialisation de la base de données:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
