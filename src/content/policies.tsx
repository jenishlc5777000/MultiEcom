/**
 * Policy templates. Numbers (shipping fee, free-shipping threshold, return
 * window, payment hold) come from store settings so they always match checkout.
 * Every <Fill> is a business detail the owner must supply, and the whole text
 * should be reviewed (ideally by a professional) before launch.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Fill } from "@/components/content/placeholder";
import type { PolicySlug } from "@/config/site";
import { formatINR } from "@/lib/utils";

export type StoreFacts = {
  shippingFlatFee: number;
  freeShippingThreshold: number;
  returnWindowDays: number;
  unpaidOrderTtlMinutes: number;
  contactEmail: string;
};

export type Policy = {
  title: string;
  lead: string;
  sections: { id: string; heading: string; body: ReactNode }[];
};

const contact = (s: StoreFacts) => (s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : <Fill>contact email</Fill>);

export function getPolicy(slug: PolicySlug, s: StoreFacts): Policy {
  switch (slug) {
    case "shipping":
      return {
        title: "Shipping Policy",
        lead: "How and when your Nibbea creations reach you.",
        sections: [
          {
            id: "charges",
            heading: "1. Shipping charges",
            body: (
              <>
                <p>We take care to prepare, pack, and deliver every order with care, whether you choose a ceramic creation or an arts &amp; crafts kit.</p>
                <ul>
                {s.shippingFlatFee === 0 ? (
                  <li>Shipping is free on every order.</li>
                ) : (
                  <li>
                    Standard shipping is <strong>{formatINR(s.shippingFlatFee)} per order</strong>
                    {s.freeShippingThreshold > 0 && (
                      <>. Shipping is free on orders of <strong>{formatINR(s.freeShippingThreshold)} or more</strong></>
                    )}
                  </li>
                )}
                  <li>The applicable shipping charge is shown at checkout before payment.</li>
                  <li>Available shipping offers will be shown on our website.</li>
                </ul>
              </>
            ),
          },
          {
            id: "dispatch",
            heading: "2. Order processing & dispatch",
            body: (
              <>
                <p>Dispatch times depend on the products in your order.</p>
                <p><strong>Ready-to-ship products:</strong> Ready-to-ship ceramics and arts &amp; crafts kits are prepared for dispatch after successful payment confirmation. Expected dispatch time: <strong>2 days</strong>.</p>
                <p><strong>Made-to-order ceramics:</strong> Some creations are made after an order is placed. Production takes an estimated <strong>7–10 days</strong> and includes shaping, drying, finishing, firing, and quality checks. Once ready, the piece is securely packed and dispatched.</p>
                <p>Production time is separate from courier delivery time. Handmade pieces may occasionally need additional time; we&apos;ll contact you if there is a significant delay.</p>
              </>
            ),
          },
          {
            id: "delivery",
            heading: "3. Delivery & order tracking",
            body: (
              <>
                <p>We ship to serviceable locations across India. Estimated delivery is <strong>5–7 days after dispatch</strong>. Timing can vary by destination PIN code, courier service, weather, and other logistics.</p>
                <p>After dispatch, tracking details will be shared through your Nibbea account or the contact details on your order, depending on the available tracking service.</p>
                <p>Please enter an accurate shipping address, PIN code, and contact number when ordering.</p>
              </>
            ),
          },
          {
            id: "packaging",
            heading: "4. Safe & secure packaging",
            body: (
              <>
                <p>Every product is packed to help it reach you in excellent condition. Ceramics are protected with materials suited to fragile items. Craft kits, figurines, paints, and brushes are securely arranged to protect their contents.</p>
                <h3>If your order arrives damaged</h3>
                <p>If you receive a broken, damaged, or incorrect product, contact our support team promptly with your order number, clear photos of the product and outer packaging, and an unboxing video if available. We&apos;ll review the issue under our <Link href="/policies/returns">Returns &amp; Refunds Policy</Link>.</p>
              </>
            ),
          },
          {
            id: "international",
            heading: "5. International shipping",
            body: <p>Our online shipping policy currently covers deliveries within India. For orders outside India, please contact us before ordering. International delivery is subject to confirmation.</p>,
          },
          {
            id: "contact",
            heading: "Need assistance?",
            body: <p>Have a question about shipping, delivery, or your order? We&apos;re happy to help. <Link href="/contact">Visit our Contact Us page</Link> for assistance.</p>,
          },
        ],
      };

    case "returns":
      return {
        title: "Returns & Refunds",
        lead: "At Nibbea, every product is thoughtfully created, carefully inspected, and securely packed. Your satisfaction matters to us, and we’re here to help if something isn’t right with your order.",
        sections: [
          {
            id: "eligibility",
            heading: "What Can Be Returned",
            body: (
              <ul>
                <li>Your product arrives damaged or defective.</li>
                <li>You receive an incorrect product.</li>
                <li>Your product is significantly different from its description.</li>
              </ul>
            ),
          },
          {
            id: "conditions",
            heading: "Return Conditions",
            body: (
              <>
                <ul>
                  <li>Items should be unused and in their original condition, wherever possible.</li>
                  <li>All supplied components and accessories should be included.</li>
                </ul>
                <p>These conditions do not affect your applicable statutory consumer rights.</p>
              </>
            ),
          },
          {
            id: "handmade",
            heading: "A Note on Our Creations",
            body: <p>Some of our products are handcrafted or individually produced, making each piece unique. Minor variations in colour, texture, shape, dimensions, and finish may naturally occur. Such variations are not considered defects unless they materially differ from the product description or agreed specifications.</p>,
          },
          {
            id: "how",
            heading: "How to Request a Return",
            body: (
              <>
                <ol>
                  <li>Contact us through our <Link href="/contact">Contact Us page</Link> within 7 days of delivery.</li>
                  <li>Share your order number, product details, and reason for the request.</li>
                  <li>For damaged, defective, or incorrect products, include clear photographs of the item and packaging. An unboxing video is helpful if available, but not mandatory.</li>
                  <li>Our team aims to respond within 2 working days with further instructions.</li>
                </ol>
                <p>Please do not send products back without receiving return instructions.</p>
              </>
            ),
          },
          {
            id: "refunds",
            heading: "Refunds",
            body: (
              <>
                <p>Once your request is reviewed and approved, we will arrange an appropriate resolution, which may include a replacement, return, or refund.</p>
                <ul>
                  <li>Approved refunds will be issued to the original payment method through our payment provider, where supported.</li>
                  <li>Refunds are generally initiated within 5–7 working days after approval or completion of any required return inspection.</li>
                  <li>Your bank or payment provider may require additional time to reflect the amount.</li>
                </ul>
                <p>If a replacement is unavailable, we will offer an appropriate refund.</p>
              </>
            ),
          },
          {
            id: "shipping",
            heading: "Return Shipping",
            body: <p>For verified damaged, defective, or incorrect products, Nibbea will arrange return shipping or cover reasonable approved return shipping costs. Customers should contact us before arranging any return shipment.</p>,
          },
          { id: "contact", heading: "Questions?", body: <p>We’re always happy to help. For return requests, refund updates, or order-related questions, please reach out through our <Link href="/contact">Contact Us page</Link>.</p> },
          { id: "signoff", heading: "", body: <p><strong>Nibbea — Crafted with Care. Delivered with Love.</strong></p> },
        ],
      };

    case "privacy":
      return {
        title: "Privacy",
        lead: "What we collect, why, and who we share it with.",
        sections: [
          {
            id: "collect",
            heading: "What we collect",
            body: (
              <ul>
                <li><strong>Account details:</strong> your email address, plus your name and profile photo if you sign in with Google.</li>
                <li><strong>Order details:</strong> your shipping address, phone number, and the items you buy.</li>
                <li><strong>Cart:</strong> if you aren&apos;t signed in, we use a cookie to remember your cart.</li>
                <li>We do <strong>not</strong> see or store your card, UPI or bank details. Payments are handled entirely by Razorpay.</li>
              </ul>
            ),
          },
          {
            id: "use",
            heading: "How we use it",
            body: (
              <ul>
                <li>To process, ship and support your orders.</li>
                <li>To send sign-in codes and order emails.</li>
                <li>Marketing emails: <Fill>say whether you send them and how to opt out</Fill>.</li>
              </ul>
            ),
          },
          {
            id: "share",
            heading: "Who we share it with",
            body: (
              <ul>
                <li><strong>Razorpay</strong>, to take payments.</li>
                <li><strong>Resend</strong>, to deliver emails.</li>
                <li><strong>Cloudinary</strong>, to host images.</li>
                <li><strong>Google</strong>, only if you choose to sign in with Google.</li>
                <li><Fill>courier partner(s)</Fill>, to deliver your parcel.</li>
              </ul>
            ),
          },
          {
            id: "cookies",
            heading: "Cookies",
            body: <p>We use essential cookies only: one to keep you signed in and one to remember your cart. <Fill>Add any analytics tools you use.</Fill></p>,
          },
          {
            id: "rights",
            heading: "Your choices",
            body: <p>You can ask us for a copy of your data, or ask us to correct or delete it, by writing to {contact(s)}. We keep order records as long as the law requires.</p>,
          },
        ],
      };

    case "terms":
      return {
        title: "Terms of sale",
        lead: "The terms that apply when you buy from us.",
        sections: [
          {
            id: "seller",
            heading: "Who you're buying from",
            body: (
              <p>
                This store is operated by <Fill>registered business name</Fill>, <Fill>address</Fill>. <Fill>GSTIN, if registered</Fill>.
              </p>
            ),
          },
          {
            id: "prices",
            heading: "Prices and payment",
            body: (
              <ul>
                <li>All prices are in Indian Rupees (INR). <Fill>Say whether prices include GST.</Fill></li>
                <li>Payments are processed securely by Razorpay. We accept UPI, cards and netbanking.</li>
                <li>Your order is confirmed once payment succeeds. Items in an unpaid checkout are held for {s.unpaidOrderTtlMinutes} minutes and then released.</li>
              </ul>
            ),
          },
          {
            id: "handmade",
            heading: "Handmade products",
            body: <p>Each piece is made by hand, so size, colour and glaze will vary slightly from the photos and from other pieces. One-of-a-kind pieces are sold only once, and the item you receive is the one pictured.</p>,
          },
          {
            id: "cancellations",
            heading: "Cancellations",
            body: <p><Fill>Say whether, and until when, an order can be cancelled after payment (for example, before dispatch, or before production starts on made-to-order pieces).</Fill></p>,
          },
          {
            id: "policies",
            heading: "Shipping and returns",
            body: <p>See our <Link href="/policies/shipping">shipping policy</Link> and <Link href="/policies/returns">returns policy</Link>.</p>,
          },
          {
            id: "law",
            heading: "Governing law",
            body: <p>These terms are governed by the laws of India. <Fill>jurisdiction city</Fill> courts have jurisdiction.</p>,
          },
          { id: "contact", heading: "Contact", body: <p>Questions about these terms: {contact(s)}.</p> },
        ],
      };
  }
}
