using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class TextPotion : MonoBehaviour
{
    private GameObject player;
    public string potionType;
    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
      player = GameObject.FindWithTag("Player");
      if(potionType == "Heal")
      {
        gameObject.GetComponent<Text>().text = "x" + player.GetComponent<PlayerController>().HealingPotion;
      } else if(potionType == "Mana")
      {
        gameObject.GetComponent<Text>().text = "x" + player.GetComponent<PlayerController>().ManaPotion;
      } else if(potionType == "Money"){
        gameObject.GetComponent<Text>().text = player.GetComponent<PlayerController>().money + " gold";
      }
    }
}
