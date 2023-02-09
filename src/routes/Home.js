import React from 'react';
import SliderMain from '../components/Landing/SliderMain';
import Footer from '../components/menu/footer';


const Home = (props) => {
  return (
    <div className='home'>
      <section className="jumbotron no-bg home-box" style={{ height: '100%', backgroundImage: `url(${'./img/main-bg.jpg'})` }}>
        <SliderMain />
        <Footer />
      </section>
    </div >
  )
};
export default Home;