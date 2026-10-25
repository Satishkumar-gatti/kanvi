// ===== EDIT THIS FILE (or use admin.html) =====
const SHOP={name:"Kanvi Cloud Kitchen",phone:"916303585986",city:"Rajahmundry",
  swiggy:"", zomato:"",            // paste restaurant links
  instagram:"", googleReview:"",   // paste Instagram + Google review link
  gaId:"",                         // Google Analytics ID e.g. G-XXXXXXX (optional)
  open:"11:00", close:"23:00", deliveryTime:"35-45 mins",
  freeDeliveryAbove:499, firstOrderCode:"FIRST50", firstOrderOff:50,
  areas:["Danavaipeta","Morampudi","Innespeta","Devi Chowk","Kotipalli Bus Stand","Lalacheruvu","Tadithota","Prakash Nagar"],
  banner:"🔥 Today's Offer: Flat ₹30 OFF on Clay Pot Biryani — order on WhatsApp!"};
// SAMPLE reviews - REPLACE with your real customer reviews (or leave [] to hide the section)
const REVIEWS=[{n:"Customer name",t:"Write a real review here. Ask happy customers for a Google review!",r:5}];
// cat = Biryani | Starters | Curries ; veg = true/false ; img = file inside assets/
const MENU=[
  {"cat": "Biryani", "name": "Clay Pot Dum Biryani", "price": 349, "offer": 319, "img": "pot-biryani.jpg", "special": true, "veg": false, "soldOut": false, "desc": "Slow-cooked in a clay handi, sealed with dough. Our signature."},
  {"cat": "Biryani", "name": "Special Veg Biryani (with Paneer Curry)", "price": 280, "offer": null, "img": "dishes/special-veg-biryani.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Paneer Biryani", "price": 250, "offer": null, "img": "dishes/paneer-biryani.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Mushroom Biryani", "price": 240, "offer": null, "img": "dishes/mushroom-biryani.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Cashew Paneer Biryani", "price": 250, "offer": null, "img": "dishes/cashew-paneer-biryani.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Paneer Tikka Biryani", "price": 280, "offer": null, "img": "dishes/paneer-tikka-biryani.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Special Veg Fried Rice", "price": 250, "offer": null, "img": "dishes/special-veg-fried-rice.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Biryani", "name": "Paneer Fried Rice", "price": 240, "offer": null, "img": "dishes/paneer-fried-rice.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Chilli Paneer", "price": 220, "offer": null, "img": "dishes/chilli-paneer.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Chilli Mushroom", "price": 200, "offer": null, "img": "dishes/chilli-mushroom.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Crispy Corn", "price": 190, "offer": null, "img": "dishes/crispy-corn.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Crispy Paneer", "price": 220, "offer": null, "img": "dishes/crispy-paneer.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Crispy Paneer Popcorn", "price": 250, "offer": null, "img": "dishes/crispy-paneer-popcorn.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Paneer Tikka", "price": 200, "offer": null, "img": "dishes/paneer-tikka.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Paneer Roast", "price": 180, "offer": null, "img": "dishes/paneer-roast.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Baby Corn Chilli 65", "price": 220, "offer": null, "img": "dishes/baby-corn-chilli-65.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Dragon Paneer", "price": 220, "offer": null, "img": "dishes/dragon-paneer.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Starters", "name": "Paneer Meridian", "price": 250, "offer": null, "img": "dishes/paneer-meridian.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Curries", "name": "Paneer Curry", "price": 180, "offer": null, "img": "dishes/paneer-curry.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Curries", "name": "Cashew Paneer Curry", "price": 220, "offer": null, "img": "dishes/cashew-paneer-curry.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Curries", "name": "Methi Chaman", "price": 220, "offer": null, "img": "dishes/methi-chaman.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Curries", "name": "Cashew Tomato Curry", "price": 250, "offer": null, "img": "dishes/cashew-tomato-curry.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""},
  {"cat": "Curries", "name": "Mushroom Curry", "price": 170, "offer": null, "img": "dishes/mushroom-curry.jpg", "special": false, "veg": true, "soldOut": false, "desc": ""}
];
