# LeadsGate — Under one roof

A self-contained interactive storefront preview. Includes 15 supplied products, 45 optimised product images, room switching, product hotspots, galleries, search, a saved home list, kit builder and email enquiry drafts.

## Vercel preview deployment

From this directory, with Vercel CLI authenticated to the authorised Tabsphere team:

```cmd
vercel --scope tabsphere
```

Use the generated preview URL to share with the client. This command does not request a production deployment. The included vercel.json serves dist directly with no dependencies or build step.

Alternatively import this folder in a Git repository into Vercel. Choose Other as the framework, leave build/install commands empty, and use dist as the output directory.

## Run locally

```cmd
python -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## Content and limitations

Product images come from the supplied LeadsGate image pack. Names are descriptive labels based on the images; exact specifications, price and stock require client confirmation. Lifestyle photos are retained from the preceding design; credits remain in the footer dialog. Home Decor and Furniture have enquiry guidance until verified products are supplied.

Home lists persist in the visitor's browser, not in a server database. Enquiries open an email draft or can be copied; nothing is sent automatically. No checkout, payment processing, stock system or admin panel is connected. WhatsApp is not connected because the business WhatsApp number has not been confirmed.

Business contact details were supplied in the project brief. Client preview remains labelled as such.
