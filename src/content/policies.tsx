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
        title: "Returns & refunds",
        lead: `You can request a return within ${s.returnWindowDays} days of delivery.`,
        sections: [
          {
            id: "eligibility",
            heading: "What can be returned",
            body: (
              <ul>
                <li>Pieces that arrive <strong>damaged</strong>, are the <strong>wrong item</strong>, or are <strong>not as described</strong>.</li>
                <li>Requests must be made within <strong>{s.returnWindowDays} days</strong> of delivery.</li>
                <li>
                  Change-of-mind returns: <Fill>say whether you accept them, and under what conditions</Fill>.
                </li>
                <li>
                  Made-to-order and custom pieces: <Fill>say whether these can be returned</Fill>.
                </li>
              </ul>
            ),
          },
          {
            id: "handmade",
            heading: "A note on handmade pieces",
            body: <p>Small variations in glaze colour, speckling, drips and form are a natural part of handmade ceramics, and they are not defects. Product photos show a representative piece.</p>,
          },
          {
            id: "how",
            heading: "How to request a return",
            body: (
              <ol>
                <li>Email {contact(s)} with your order number (it&apos;s on your profile page and in your confirmation email).</li>
                <li>Tell us which items and why. For damaged or wrong items, add photos of the piece and of the outer box.</li>
                <li>We&apos;ll reply with next steps, usually within <Fill>number</Fill> working days.</li>
              </ol>
            ),
          },
          {
            id: "refunds",
            heading: "Refunds",
            body: (
              <>
                <p>Approved refunds go back to your original payment method through Razorpay. Banks usually take 5 to 7 working days to show the amount.</p>
                <p>
                  Return shipping costs: <Fill>say who pays for return shipping and in which cases</Fill>.
                </p>
              </>
            ),
          },
          { id: "contact", heading: "Questions", body: <p>Write to {contact(s)} with your order number.</p> },
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
