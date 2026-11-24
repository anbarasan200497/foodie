from extensions import execute, query


def all():
    return query(
        """SELECT c.id, c.name, COUNT(f.id) AS item_count
           FROM food_categories c LEFT JOIN food_items f ON f.category_id = c.id
           GROUP BY c.id ORDER BY c.name""")


def get(category_id):
    return query("SELECT * FROM food_categories WHERE id=%s", (category_id,), one=True)


def get_by_name(name):
    return query("SELECT * FROM food_categories WHERE name=%s", (name,), one=True)


def create(name):
    return execute("INSERT INTO food_categories (name) VALUES (%s)", (name,))


def rename(category_id, name):
    execute("UPDATE food_categories SET name=%s WHERE id=%s", (name, category_id))


def delete(category_id):
    execute("DELETE FROM food_categories WHERE id=%s", (category_id,))


def with_images(food_type=None):
    """Categories that have available foods, each with one photo (for the 'What's on your mind?' row).
    If food_type is 'veg' or 'nonveg', only foods of that type are counted."""
    cond = ""
    params = ()
    if food_type in ("veg", "nonveg"):
        cond = " AND {a}.food_type = %s"
        params = (food_type, food_type)
    sql = (
        "SELECT c.id, c.name, "
        "(SELECT f.image FROM food_items f WHERE f.category_id = c.id AND f.is_available = 1 "
        "AND f.image IS NOT NULL" + cond.format(a="f") + " "
        "ORDER BY f.is_bestseller DESC, f.id LIMIT 1) AS image "
        "FROM food_categories c "
        "WHERE EXISTS (SELECT 1 FROM food_items g WHERE g.category_id = c.id AND g.is_available = 1"
        + cond.format(a="g") + ") "
        "ORDER BY c.name"
    )
    return query(sql, params)