
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS loyalty_transactions;
DROP TABLE IF EXISTS loyalty_holds;
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS inventory_reservations;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS variant_prices;
DROP TABLE IF EXISTS variant_attribute_values;
DROP TABLE IF EXISTS attribute_values;
DROP TABLE IF EXISTS attributes;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 01. Käyttäjät (tunnistautumistiedot erillisessa taulussa)
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'ADMIN')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 02. Kirjautumistiedot: 1:1 users-tauluun (ei selväkielistä salasanaa)
CREATE TABLE user_credentials (
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_credentials_email (email),
    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 03. Käyttäjän muistissa säilytettävät osoitteet
CREATE TABLE user_addresses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    label VARCHAR(50) NULL,
    street_address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'FI',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_user_addresses_user (user_id),
    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_user_addresses_default CHECK (is_default IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 04. Tuotemerkit (esim. Nike)
CREATE TABLE brands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 05. Kategoriat ja mahdolliset alakategoriat
CREATE TABLE categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_id BIGINT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_slug (slug),
    KEY idx_categories_parent (parent_id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
        REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_categories_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 06. Yleinen tuote (esim. 'Nike Air Force 1')
CREATE TABLE products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id BIGINT UNSIGNED NOT NULL,
    brand_id BIGINT UNSIGNED NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_category (category_id),
    KEY idx_products_brand (brand_id),
    KEY idx_products_active_name (is_active, name),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
        REFERENCES brands (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_products_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 07. Myytävä SKU-variantti: esim. Nike Air Force 1 / musta / 42
CREATE TABLE product_variants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(80) NOT NULL,
    barcode VARCHAR(80) NULL,
    shipping_weight_g INT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_variants_sku (sku),
    UNIQUE KEY uq_product_variants_id_product (id, product_id),
    KEY idx_product_variants_product (product_id),
    CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_product_variants_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 08. Tuotekuvat, valinnaisesti tietylle variantille (variantin on kuuluttava tuotteeseen)
CREATE TABLE product_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_product_images_product_sort (product_id, sort_order),
    KEY idx_product_images_variant_product (variant_id, product_id),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_product_images_variant_product FOREIGN KEY (variant_id, product_id)
        REFERENCES product_variants (id, product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 09. Ominaisuustyypit (esim. Koko, Väri, Paino, Maku)
CREATE TABLE attributes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attributes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Sallitut arvot (esim. koko=M, paino=0.1 [kg], väri=musta)
CREATE TABLE attribute_values (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attribute_id BIGINT UNSIGNED NOT NULL,
    value VARCHAR(100) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attribute_values_attribute_value (attribute_id, value),
    UNIQUE KEY uq_attribute_values_attribute_id (attribute_id, id),
    CONSTRAINT fk_attribute_values_attribute FOREIGN KEY (attribute_id)
        REFERENCES attributes (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Variantin ominaisuudet. Yhdellä variantilla yksi arvo / ominaisuustyyppi.
CREATE TABLE variant_attribute_values (
    variant_id BIGINT UNSIGNED NOT NULL,
    attribute_id BIGINT UNSIGNED NOT NULL,
    attribute_value_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (variant_id, attribute_id),
    KEY idx_vav_attribute_value (attribute_id, attribute_value_id),
    CONSTRAINT fk_vav_variant FOREIGN KEY (variant_id)
        REFERENCES product_variants (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vav_attribute_value FOREIGN KEY (attribute_id, attribute_value_id)
        REFERENCES attribute_values (attribute_id, id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Kunkin variantin tämänhetkinen hinta (hintaseuranta voidaan lisätä myöhemmin)
CREATE TABLE variant_prices (
    variant_id BIGINT UNSIGNED NOT NULL,
    price_cents BIGINT UNSIGNED NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_id),
    CONSTRAINT fk_variant_prices_variant FOREIGN KEY (variant_id)
        REFERENCES product_variants (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Keskusvarasto ja noutopisteet. HSL-reittihakua varten koordinaatit.
CREATE TABLE locations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    location_type VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    default_pickup_days SMALLINT UNSIGNED NOT NULL DEFAULT 14,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_locations_type_active (location_type, is_active),
    CONSTRAINT chk_locations_type CHECK (location_type IN ('WAREHOUSE', 'PICKUP_POINT')),
    CONSTRAINT chk_locations_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_locations_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_locations_pickup_days CHECK (default_pickup_days > 0),
    CONSTRAINT chk_locations_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Fyysinen varastosaldo ja varaukset sijainneittain.
-- Noutopisteiden tavarat seurataan tilauksista ja lahetyksista, ei "vapaana saldona".
-- Sovellus luo inventory-rivit keskusvarastolle ja kayttaa vain WAREHOUSE-sijainteja.
CREATE TABLE inventory (
    location_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity_on_hand INT UNSIGNED NOT NULL DEFAULT 0,
    quantity_reserved INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id, variant_id),
    KEY idx_inventory_variant (variant_id),
    CONSTRAINT fk_inventory_location FOREIGN KEY (location_id)
        REFERENCES locations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_variant FOREIGN KEY (variant_id)
        REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_reserved CHECK (quantity_reserved <= quantity_on_hand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Kirjautuneen asiakkaan pysyvä ostoskori
CREATE TABLE carts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_carts_user (user_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Ostoskorin rivit (vierasostoskori voi olla selaimen localStoragessa)
CREATE TABLE cart_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_items_cart_variant (cart_id, variant_id),
    KEY idx_cart_items_variant (variant_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
        REFERENCES carts (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id)
        REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tilaukset, myos vieraille user_id=NULL. Asiakkaan tiedot snapshotina.
CREATE TABLE orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    pickup_location_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'FI',
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    subtotal_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
    campaign_discount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
    loyalty_points_used INT UNSIGNED NOT NULL DEFAULT 0,
    loyalty_discount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ready_at DATETIME NULL,
    pickup_deadline DATETIME NULL,
    collected_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_id_user (id, user_id),
    KEY idx_orders_user_created (user_id, created_at),
    KEY idx_orders_pickup_status (pickup_location_id, status),
    KEY idx_orders_status_deadline (status, pickup_deadline),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_orders_pickup_location FOREIGN KEY (pickup_location_id)
        REFERENCES locations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_orders_status CHECK (status IN (
        'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'IN_TRANSIT',
        'READY_FOR_PICKUP', 'COLLECTED', 'EXPIRED', 'RETURNING',
        'RETURNED', 'CANCELLED'
    )),
    CONSTRAINT chk_orders_discount CHECK (
        subtotal_cents >= campaign_discount_cents + loyalty_discount_cents
    ),
    CONSTRAINT chk_orders_total CHECK (
        total_cents = subtotal_cents - campaign_discount_cents - loyalty_discount_cents
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Tilausrivit: hinta, tuotteen nimi ja SKU kopioidaan ostotilanteessa.
CREATE TABLE order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_label VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(80) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price_cents BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_items_order_variant (order_id, variant_id),
    UNIQUE KEY uq_order_items_id_variant (id, variant_id),
    KEY idx_order_items_variant (variant_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id)
        REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Maksuprosessin aikainen varaus (yksi varaus / tilausrivi).
-- HELD: saldosta varattu, maksu kesken; ALLOCATED: maksettu ja varattu;
-- FULFILLED: lahetetty (fyysinen saldo ja varattu maara pienennettu);
-- RELEASED/EXPIRED: varaus vapautettu.
CREATE TABLE inventory_reservations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_item_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD',
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_reservations_order_item (order_item_id),
    KEY idx_inventory_reservations_item_variant (order_item_id, variant_id),
    KEY idx_inventory_reservations_inventory (location_id, variant_id),
    KEY idx_inventory_reservations_expiry (status, expires_at),
    CONSTRAINT fk_inventory_reservations_order_item_variant
        FOREIGN KEY (order_item_id, variant_id)
        REFERENCES order_items (id, variant_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_reservations_inventory
        FOREIGN KEY (location_id, variant_id)
        REFERENCES inventory (location_id, variant_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_reservations_qty CHECK (quantity > 0),
    CONSTRAINT chk_inventory_reservations_status CHECK (
        status IN ('HELD', 'ALLOCATED', 'FULFILLED', 'RELEASED', 'EXPIRED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Maksuyritykset, yhdella tilauksella voi olla useita yrityksia
CREATE TABLE payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(60) NOT NULL,
    provider_payment_id VARCHAR(180) NULL,
    amount_cents BIGINT UNSIGNED NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    status VARCHAR(25) NOT NULL DEFAULT 'CREATED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_provider_reference (provider, provider_payment_id),
    KEY idx_payments_order (order_id),
    KEY idx_payments_status (status),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_payments_status CHECK (
        status IN ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED',
                   'PARTIALLY_REFUNDED', 'REFUNDED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Maksun palautukset (esim. noutamatta jaanyt tilaus)
CREATE TABLE refunds (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    provider_refund_id VARCHAR(180) NULL,
    amount_cents BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refunds_provider_reference (provider_refund_id),
    KEY idx_refunds_payment (payment_id),
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id)
        REFERENCES payments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_refunds_amount CHECK (amount_cents > 0),
    CONSTRAINT chk_refunds_status CHECK (
        status IN ('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Tilauksen meno- ja palautuslahetykset; ei siirtoja noutopisteiden valilla.
CREATE TABLE shipments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    direction VARCHAR(10) NOT NULL,
    from_location_id BIGINT UNSIGNED NOT NULL,
    to_location_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    tracking_code VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shipments_order_direction (order_id, direction),
    KEY idx_shipments_from (from_location_id),
    KEY idx_shipments_to (to_location_id),
    CONSTRAINT fk_shipments_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_from FOREIGN KEY (from_location_id)
        REFERENCES locations (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_shipments_to FOREIGN KEY (to_location_id)
        REFERENCES locations (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_shipments_direction CHECK (direction IN ('OUTBOUND', 'RETURN')),
    CONSTRAINT chk_shipments_status CHECK (
        status IN ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')
    ),
    CONSTRAINT chk_shipments_distinct_locations CHECK (from_location_id <> to_location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Fyysisen varaston muutosloki (reservointi EI muuta fyysista saldoa)
CREATE TABLE inventory_movements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    location_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    shipment_id BIGINT UNSIGNED NULL,
    quantity_delta INT NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inventory_movements_inventory (location_id, variant_id),
    KEY idx_inventory_movements_order (order_id),
    KEY idx_inventory_movements_shipment (shipment_id),
    CONSTRAINT fk_inventory_movements_inventory FOREIGN KEY (location_id, variant_id)
        REFERENCES inventory (location_id, variant_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movements_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movements_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inventory_movements_delta CHECK (quantity_delta <> 0),
    CONSTRAINT chk_inventory_movements_type CHECK (
        movement_type IN ('RECEIPT', 'DISPATCH', 'RETURN', 'ADJUSTMENT')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Lojaalisuuspisteiden varaus maksun ajaksi, ei kuluteta kahdesti.
CREATE TABLE loyalty_holds (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    points INT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD',
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_loyalty_holds_order (order_id),
    KEY idx_loyalty_holds_order_user (order_id, user_id),
    KEY idx_loyalty_holds_user_status (user_id, status),
    KEY idx_loyalty_holds_status_expiry (status, expires_at),
    CONSTRAINT fk_loyalty_holds_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_loyalty_holds_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_loyalty_holds_points CHECK (points > 0),
    CONSTRAINT chk_loyalty_holds_status CHECK (
        status IN ('HELD', 'CAPTURED', 'RELEASED')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Pistetapahtumat: ostot, bonukset, lunastukset ja korjaukset
CREATE TABLE loyalty_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    points_delta INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    description VARCHAR(255) NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_loyalty_transactions_idempotency (idempotency_key),
    KEY idx_loyalty_transactions_order_user (order_id, user_id),
    KEY idx_loyalty_transactions_user_created (user_id, created_at),
    CONSTRAINT fk_loyalty_transactions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_loyalty_transactions_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_loyalty_transactions_delta CHECK (points_delta <> 0),
    CONSTRAINT chk_loyalty_transactions_type CHECK (
        transaction_type IN ('PURCHASE', 'BONUS', 'REDEEM', 'REFUND', 'ADJUSTMENT')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Tilamuutosten tapahtumaloki admin-nakymalle ja virheiden selvitykseen
CREATE TABLE order_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    note VARCHAR(255) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_status_history_order_changed (order_id, changed_at),
    KEY idx_order_status_history_actor (changed_by_user_id),
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_status_history_actor FOREIGN KEY (changed_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


