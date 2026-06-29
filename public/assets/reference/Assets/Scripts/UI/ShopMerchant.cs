using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ShopMerchant : MonoBehaviour
{
    public string product;
    public int price;

    // Update is called once per frame
    void Update()
    {

    }

    void buy(){
      PlayerController player = GameObject.FindWithTag("Player").GetComponent<PlayerController>();
      if(player.money < price){
        return;
      }

      if(product == "Health")
      {
        player.buyPotionHealth();
        GameObject.FindWithTag("AnimPotionHealth").GetComponent<Animator>().SetTrigger("Buying");
      } else if (product == "Mana"){
        player.buyPotionMana();
        GameObject.FindWithTag("AnimPotionMana").GetComponent<Animator>().SetTrigger("Buying");
      }
      player.money -= price;
    }
}
