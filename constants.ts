import { SchemaTable } from './types';

// This schema is passed to the LLM to understand the data structure
export const DB_SCHEMA: SchemaTable[] = [
  {
    tableName: 'customers',
    columns: ['customer_id', 'first_name', 'last_name', 'email', 'signup_date', 'country', 'segment'],
    description: 'Stores customer details. Segments include Retail, Corporate, SME.'
  },
  {
    tableName: 'products',
    columns: ['product_id', 'product_name', 'category', 'price', 'stock_quantity', 'supplier_id'],
    description: 'Inventory of electronics and accessories.'
  },
  {
    tableName: 'orders',
    columns: ['order_id', 'customer_id', 'order_date', 'status', 'total_amount', 'shipping_address'],
    description: 'Main order headers. Status can be Pending, Shipped, Delivered, Cancelled.'
  },
  {
    tableName: 'order_items',
    columns: ['item_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price'],
    description: 'Line items for each order linking products to orders.'
  },
  {
    tableName: 'regions',
    columns: ['region_id', 'region_name', 'manager_name'],
    description: 'Sales regions for geographical analysis.'
  }
];

export const SUGGESTED_QUERIES = [
  "Show total sales by product category for 2024",
  "Monthly sales trend for the last year (Line Chart)",
  "Customer distribution by country (Pie Chart)",
  "List top 5 customers by total spending",
  "Compare revenue: Electronics vs Furniture",
];
