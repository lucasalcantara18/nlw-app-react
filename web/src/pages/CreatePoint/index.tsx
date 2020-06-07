import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import logo from '../../assets/logo.svg';
import './styles.css';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import { LeafletMouseEvent, LeafletMouseEventHandlerFn } from 'leaflet'
import api from '../../services/api';
import axios from 'axios';


/** OBS:
 * Sempre que criar um estado para array ou objeto, é necessario informar o tipo da variavel armazenada ali dentro.
 * a interface abaixo tem esse proposito
 */

 interface Item{
     id:number;
     title:string;
     image_url:string;
 }

 interface UF{
    // id:number;
    sigla:string;
    // nome:string;
}

interface Cities{
    // id:number;
    nome:string;
    // image_url:string;
}





const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [selectedPositionInit, setSelectedPositionInit] = useState<[number, number]>([0,0]);
    const [formData, setFormData] = useState({name:'', email:'', whatsapp: ''});
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();

    //serve para executar uma função toda vez que o indicador passado mudar. Caso o indicador for vazio, a função é executada somente uma vez.
    useEffect(() => {//pegar os itens e imagens do back edn
        api.get('itens').then(res => {
            console.log(res);
            setItems(res.data);
        })
    }, []);


    useEffect(() => {//pegar os itens e imagens do back edn
       navigator.geolocation.getCurrentPosition(position => {
          const {latitude, longitude} = position.coords;
          setSelectedPositionInit([latitude, longitude]);
       });
    }, []);

    useEffect(() => {//pega todas as uf pela api do ibge
        axios.get<UF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(res => {
            const ufsl = res.data.map(uf => uf.sigla);
            setUfs(ufsl); 
        })
    }, []);

    useEffect(() => {//pegar as cidades quando o usuario selecionar uf
        if(selectedUf === '0'){
            return;
        }
        axios.get<Cities[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(res => {
            const cities = res.data.map(city => city.nome);
            setCities(cities); 
        })
    }, [selectedUf]);

    const handleSelectUf = (event: ChangeEvent<HTMLSelectElement>) => {
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    const handleSelectCity = (event: ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value;
        setSelectedCity(city);
    }

    const handleMapClick = (event: LeafletMouseEvent) => {
       console.log(event.latlng);
       setSelectedPosition([event.latlng.lat, event.latlng.lng]);
       
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const {name, value} = event.target;
      setFormData({...formData, [name]:value})
    }

     const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        
        
        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;


        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            itens: items
        }
        console.log(data);
        
        
        await api.post('points', data);
        alert('Ponto de Coleta Criado');   
        history.push('/')     
        
    }

    const handleClickIcons = (id: number) => {

        const alredySelected = selectedItems.findIndex(item => item === id);

        if(alredySelected >= 0){
            const filteredValues = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredValues);
        }else{
            setSelectedItems([...selectedItems, id]);
        }
        

    }

    return(
       <div id="page-create-point">
           <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft/> Voltar para a Home
                </Link>
           </header>

          <form onSubmit={handleSubmit}>
              <h1>Cadastro <br/>de ponto de Coleta</h1>

              <fieldset>
                <legend>
                    <h2>Dados</h2>
                </legend>

                <div className="field">
                    <label htmlFor="name">Nome da Entidade</label>
                    <input type="text" name="name" id="name" onChange={handleInputChange}/>
                </div>

                <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" id="email" onChange={handleInputChange}/>
                    </div>
                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                    </div>

                </div>


              </fieldset>

              
              <fieldset>
                  <legend>
                      <h2>Endereço</h2>
                      <span>Selecione o Endereõ no mapa</span>
                  </legend>

                  <Map center={selectedPositionInit} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}>
                            <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup>
                        </Marker>
                   </Map>

                  <div className="field-group">
                    <div className="field">
                        <label htmlFor="uf">Estado (UF)</label>
                        <select  name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                            <option value="0">Selecione uma UF</option>
                            {ufs.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="city">Cidade</label>
                        <select  name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                            <option value="0">Selecione uma Cidade</option>
                            {cities.map(cities => (
                                <option key={cities} value={cities}>{cities}</option>
                            ))}
                        </select>
                    </div>
                  </div>

              </fieldset>

              
              <fieldset>
                  <legend>
                      <h2>Ítens de Coleta</h2>
                      <span>Selecione um ou mais itens</span>
                  </legend>

                  <ul className="items-grid">
                      {items.map(item => (
                          <li key={item.id} onClick={() => handleClickIcons(item.id)} className={selectedItems.includes(item.id) ? 'selected' : ''}> 
                              <img src={item.image_url} alt={item.title}/> 
                              <span>{item.title}</span>
                        </li>
                      ))}
                  </ul>
              </fieldset>

              <button type="submit">Cadastrar ponto de coleta</button>
          </form>

       </div>
    );


}

export default CreatePoint;